var busy = false
var finishedTasks = {}
var callbacks = []
var taskQueue = []
var taskQueue = []
var taskIndex = 0

import {
  findItem,
  objectForEach,
  deleteItem,
  findItemsInFolder,
  typeString
} from './utils'

export function removeMidiFile(path) {
  let item
  const items = []
  let folder

  if (path.className === 'MidiFile') {
    item = path
    path = item.localPath
  } else {
    item = findItem(path, this.storage.midi)
  }

  if (item.className === 'MidiFile') {
    items.push(item)
  } else {
    folder = item
    objectForEach(folder, function(item) {
      if (item.className === 'MidiFile') {
        items.push(item)
      }
    })
  }

  for (let i = items.length - 1; i >= 0; i--) {
    item = items[i]
    deleteItem(item.localPath, this.storage.midi)
  }
}

export function removeInstrument(path, unloadSamples) {
  var item,
    items = [],
    i,
    folder,
    mapping,
    samplePath

  if (path.className === 'InstrumentConfig') {
    item = path
    path = item.localPath
  } else {
    item = findItem(path, this.storage.instruments)
  }

  if (item.className === 'InstrumentConfig') {
    items.push(item)
  } else {
    folder = item
    for (i in folder) {
      if (folder.hasOwnProperty(i)) {
        item = folder[i]
        if (item.className === 'InstrumentConfig') {
          items.push(item)
        }
      }
    }
  }

  for (i = items.length - 1; i >= 0; i--) {
    item = items[i]
    //console.log(item.mapping);
    mapping = item.mapping
    samplePath = item.sample_path

    if (unloadSamples === true) {
      // delete samples
      objectForEach(mapping, function(value) {
        deleteItem(samplePath + '/' + value.n, this.storage.audio)
      })
      // delete sample pack
      deleteItem(samplePath, this.storage.samplepacks)
    }
    // remove instrument from storage
    deleteItem(item.localPath, this.storage.instruments)
    //return deleteItem(path, storage.instruments);
  }

  // if an instrument has been removed, inform the tracks that used that instrument
  this.updateInstruments()
}

export function removeSamplePack(path) {
  var item,
    items = [],
    i,
    samples,
    sample,
    s,
    folder

  if (path.className === 'SamplePack') {
    item = path
    path = item.localPath
  } else {
    item = findItem(path, this.storage.samplepacks)
  }

  if (item.className === 'SamplePack') {
    items.push(item)
  } else {
    folder = item
    objectForEach(folder, function(item) {
      if (item.className === 'SamplePack') {
        items.push(item)
      }
    })
  }

  for (i = items.length - 1; i >= 0; i--) {
    item = items[i]
    samples = item.samples
    for (s = samples.length - 1; s >= 0; s--) {
      sample = samples[s]
      deleteItem(sample.folder + '/' + sample.id, storage.audio)
    }
    item.reset()
    deleteItem(item.localPath, storage.samplepacks)
  }

  this.updateInstruments()
}

export function removeAssetPack(path) {
  var item, folder

  if (path.className === 'AssetPack') {
    item = path
    path = item.localPath
  } else {
    item = findItem(path, this.storage.assetpacks)
  }

  if (item.className === 'AssetPack') {
    item.unload()
  } else {
    folder = item
    objectForEach(folder, function(item) {
      if (item.className === 'AssetPack') {
        item.unload()
      }
    })
  }
}

export function startTaskQueue(cb) {
  if (busy === true) {
    return
  }
  busy = true
  loadQueueLoop(0, cb)
}

export function addTask(task, callback, callbackAfterAllTasksAreDone) {
  task.id = 'task' + taskIndex++
  taskQueue.push(task)
  if (callback !== undefined) {
    if (callbackAfterAllTasksAreDone === true) {
      // call the callback only after all tasks are done
      addCallbackAfterTask(callback)
    } else {
      // call the callback right after this task is done
      addCallbackAfterTask(callback, [task.id])
    }
  }
  return task.id
}

export function addCallbackAfterTask(callback, taskIds) {
  callbacks.push({
    method: callback,
    taskIds: taskIds
  })
}

export function getInstrument(path, exact_match) {
  return findItem(path, this.storage.instruments, exact_match)
}

export function getMidiFile(path, exact_match) {
  return findItem(path, this.storage.midi, exact_match)
}

export function getSamplePack(path, exact_match) {
  return findItem(path, this.storage.samplepacks, exact_match)
}

export function getSample(path, exact_match) {
  return findItem(path, this.storage.audio, exact_match)
}

export function getAssetPack(path, exact_match) {
  return findItem(path, this.storage.assetpacks, exact_match)
}

export function getSamplePacks(path, include_subfolders) {
  return findItemsInFolder(path, this.storage.samplepacks, include_subfolders)
}

export function getAssetPacks(path, include_subfolders) {
  return findItemsInFolder(path, this.storage.assetpacks, include_subfolders)
}

export function getSamples(path, include_subfolders) {
  return findItemsInFolder(path, this.storage.audio, include_subfolders)
}

export function getInstruments(path, include_subfolders) {
  return findItemsInFolder(path, this.storage.instruments, include_subfolders)
}

export function getMidiFiles(path, include_subfolders) {
  return findItemsInFolder(path, storage.midi, include_subfolders)
}

function loadQueueLoop(index, onTaskQueueDone) {
  var task, params, scope, i, j, callback, taskIds, performCallback

  if (index === taskQueue.length) {
    // call all callbacks that have to be called at the end of the loop queue
    for (i = callbacks.length - 1; i >= 0; i--) {
      callback = callbacks[i]
      if (callback === false) {
        // this callback has already been called
        continue
      }
      var m = callback.method
      setTimeout(function() {
        m()
      }, 0)
    }
    finishedTasks = {}
    taskQueue = []
    callbacks = []
    taskIndex = 0
    busy = false
    if (onTaskQueueDone) {
      // for internal use only, never used so far
      console.log('onTaskQueueDone')
      onTaskQueueDone()
    }
    return
  }

  task = taskQueue[index]
  scope = task.scope || null
  params = task.params || []

  if (typeString(params) !== 'array') {
    params = [params]
  }

  function cbActionLoop(success) {
    // set a flag that this task has been done
    finishedTasks[task.id] = true

    // check which callbacks we can call now
    for (i = callbacks.length - 1; i >= 0; i--) {
      callback = callbacks[i]
      if (callback === false) {
        // this callback has already been called
        continue
      }
      taskIds = callback.taskIds
      // some callbacks may only be called after a task, or a number of tasks have been done
      if (taskIds !== undefined) {
        performCallback = true
        for (j = taskIds.length - 1; j >= 0; j--) {
          // if one of the required tasks has not been done yet, do not perform the callback
          if (finishedTasks[taskIds[j]] !== true) {
            performCallback = false
          }
        }
        if (performCallback) {
          //callback.method.call(null);
          var m = callback.method
          callbacks[i] = false
          setTimeout(function() {
            m(success)
          }, 0)
        }
      }
    }

    index++

    loadQueueLoop(index, onTaskQueueDone)
  }

  params.push(cbActionLoop)

  task.method.apply(scope, params)
}
