export function pathToArray(path) {
  if (path === undefined) {
    return []
  }

  return path
    .replace(/undefined/g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split('/')
}

export function objectForEach(o, cb) {
  let obj = o
  for (let name in obj) {
    if (obj.hasOwnProperty(name)) {
      cb(obj[name], name)
    }
  }
}

export function findItem(path, root, exact_match) {
  let item

  exact_match = exact_match === undefined ? false : exact_match

  if (path === undefined || path === '') {
    return root
  }

  const folders = pathToArray(path)
  const itemId = folders.pop()

  if (itemId === '') {
    return root
  }

  let foundItem = false

  if (folders.length > 0) {
    let currentFolder = root

    for (let i = 0; i < folders.length; i++) {
      currentFolder = currentFolder[folders[i]]
      if (currentFolder === undefined) {
        break
      }
    }

    if (currentFolder) {
      item = currentFolder[itemId]
    }
  }

  if (item === undefined) {
    if (exact_match === true) {
      item = root[itemId]
    } else {
      loop(root, itemId, '.')
      item = foundItem
    }
  }

  if (item === undefined) {
    item = false
  }
  return item
}

export function deleteItem(path, root) {
  var item,
    itemId,
    i,
    obj = root

  // for deleting items you need to specify the complete path, hence the 3rd argument is set to true
  //console.log('deleteItem', path);
  item = findItem(path, root, true)

  /*
      // what was this for, because it doesn't work when deleting samples (as AudioBuffer) from storage.audio:
      item = findItem(path, root);
      console.log(item);
      path = item.folder + '/' + item.name;
      console.log(path);
  */

  if (!item) {
    return false
  } else if (item.className === 'Folder') {
    // remove files in folder
    for (i in item) {
      if (item.hasOwnProperty(i)) {
        if (i !== 'className') {
          delete item[i]
        }
      }
    }
  }

  path = pathToArray(path)

  while (path.length > 1) {
    i = 0
    obj = root

    while (i < path.length - 1) {
      //console.log(path[i],obj);
      obj = obj[path[i++]]
    }
    //console.log(obj);
    itemId = path[i]
    item = obj[itemId]

    if (item.className === 'Folder') {
      if (isEmptyObject(item, 'path className')) {
        delete obj[itemId]
        //console.log('deleting empty folder', itemId);
      }
    } else {
      delete obj[itemId]
      //console.log('deleting item', itemId);
    }

    path.pop()
  }

  //console.log(path, path[0] === '', root[path[0]]);

  if (path.length === 1 && path[0] !== '') {
    itemId = path[0]
    item = root[itemId]
    //console.log(path, path.length, itemId);
    if (item.className === 'Folder') {
      if (isEmptyObject(root[itemId], 'path className')) {
        delete root[itemId]
        //console.log('deleting empty folder', itemId, '(2)');
      }
    } else {
      delete root[itemId]
      //console.log('deleting item', itemId, '(2)');
    }
  }
  return true
}

export function typeString(o) {
  if (typeof o != 'object') {
    return typeof o
  }

  if (o === null) {
    return 'null'
  }

  //object, array, function, date, regexp, string, number, boolean, error
  var internalClass = Object.prototype.toString
    .call(o)
    .match(/\[object\s(\w+)\]/)[1]
  return internalClass.toLowerCase()
}

export function findItemsInFolder(path, root, search_subfolders) {
  search_subfolders = search_subfolders === undefined ? true : search_subfolders
  var folders = pathToArray(path),
    numFolders = folders.length,
    currentFolder,
    i,
    folder,
    foundFolder,
    searchFolder = folders[numFolders - 1],
    items = []

  if (numFolders === 0) {
    // return all items in root folder (for instance sequencer.storage.midi)
    loop3(root, items, search_subfolders, '.')
  } else {
    currentFolder = root

    for (i = 0; i < numFolders; i++) {
      folder = folders[i]
      currentFolder = currentFolder[folder]
      if (currentFolder === undefined) {
        break
      }
    }
    if (currentFolder) {
      loop3(currentFolder, items, search_subfolders, '.')
    } else {
      foundFolder = false
      loop2(root, searchFolder, '.')
      loop3(foundFolder, items, search_subfolders, '.')
    }
  }

  items.sort(function(a, b) {
    var nameA = a.name.toLowerCase(),
      nameB = b.name.toLowerCase()
    if (nameA < nameB) {
      //sort string ascending
      return -1
    } else if (nameA > nameB) {
      return 1
    }
    return 0 //default return value (no sorting)
  })

  return items
}

function loop2(root, id, indent) {
  var i, tmp
  for (i in root) {
    if (foundFolder !== false) {
      return
    }
    if (root.hasOwnProperty(i)) {
      tmp = root[i]
      if (tmp !== undefined && tmp.className === 'Folder') {
        if (i === id) {
          foundFolder = tmp
          return
        } else {
          loop2(tmp, id, indent + '.')
        }
      }
    }
  }
}

function loop3(folder, items, search_subfolders, indent) {
  var i, item
  for (i in folder) {
    if (folder.hasOwnProperty(i)) {
      if (i === 'id' || i === 'path' || i === 'className') {
        continue
      }
      item = folder[i]

      if (item === undefined) {
        continue
      }

      if (item.className === 'Folder') {
        if (search_subfolders === true) {
          loop3(item, items, search_subfolders, indent + '.')
        }
      } else {
        // loaded samples are audio object so they don't have a name, we use the key of the storage for name
        if (item.name === undefined) {
          items.push({ name: i, data: item })
        } else {
          items.push(item)
        }
      }
    }
  }
}

export function storeItem(item, path, root) {
  var folder,
    folders,
    numFolders,
    currentFolder,
    i,
    pathString = ''
  folders = pathToArray(path)
  numFolders = folders.length
  currentFolder = root

  for (i = 0; i < numFolders; i++) {
    folder = folders[i]
    pathString += '/' + folder
    //console.log(folder);
    if (currentFolder[folder] === undefined) {
      currentFolder[folder] = {
        path: pathString,
        className: 'Folder'
      }
    }
    if (i === numFolders - 1) {
      currentFolder[folder] = item
      break
    }
    currentFolder = currentFolder[folder]
  }
}

export function ajax(config) {
  var request = new XMLHttpRequest(),
    method = config.method === undefined ? 'GET' : config.method,
    fileSize,
    promise

  function executor(resolve, reject) {
    reject = reject || function() {}
    resolve = resolve || function() {}

    request.onload = function() {
      if (request.status !== 200) {
        reject(request.status)
        return
      }

      if (config.responseType === 'json') {
        fileSize = request.response.length
        resolve(JSON.parse(request.response), fileSize)
      } else {
        resolve(request.response)
      }
    }

    request.onerror = function(e) {
      config.onError(e)
    }

    request.open(method, config.url, true)

    if (config.overrideMimeType) {
      request.overrideMimeType(config.overrideMimeType)
    }

    if (config.responseType) {
      if (config.responseType === 'json') {
        request.responseType = 'text'
      } else {
        request.responseType = config.responseType
      }
    }

    if (method === 'POST') {
      request.setRequestHeader(
        'Content-type',
        'application/x-www-form-urlencoded'
      )
    }

    if (config.data) {
      request.send(config.data)
    } else {
      request.send()
    }
  }

  promise = new Promise(executor)
  //console.log(promise);

  if (config.onSuccess !== undefined) {
    promise.then(config.onSuccess, config.onError)
  } else {
    return promise
  }
}
