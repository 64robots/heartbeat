import {
  objectForEach,
  findItem,
  deleteItem,
  storeItem,
  ajax,
  typeString
} from './utils'
import {
  removeAssetPack,
  removeMidiFile,
  removeInstrument,
  removeSamplePack
} from './asset_manager'

const AssetPack = function(config) {
  this.id = 'AP' + index++ + new Date().getTime()
  this.name = this.id
  this.className = 'AssetPack'
  this.loaded = false
  this.midifiles = config.midifiles || []
  this.samplepacks = config.samplepacks || []
  this.instruments = config.instruments || []
  this.url = config.url
  var pack = this
  objectForEach(config, function(val, key) {
    pack[key] = val
  })
}

function cleanup(assetpack, callback) {
  assetpack = null
  callback(false)
}

function store(assetpack) {
  var occupied = findItem(assetpack.localPath, this.storage.assetpacks, true),
    action = assetpack.action

  if (
    occupied &&
    occupied.className === 'AssetPack' &&
    action !== 'overwrite'
  ) {
    if (this.debug >= 2) {
      console.warn('there is already an AssetPack at', assetpack.localPath)
    }
    return true
  } else {
    storeItem(assetpack, assetpack.localPath, this.storage.assetpacks)
    return false
  }
}

function load(pack, callback) {
  if (pack.url !== undefined) {
    ajax({
      url: pack.url,
      responseType: 'json',
      onError: function(e) {
        cleanup(pack, callback)
      },
      onSuccess: function(data, fileSize) {
        // if the json data is corrupt (for instance because of a trailing comma) data will be null
        if (data === null) {
          callback(false)
          return
        }

        pack.loaded = true

        if (data.name !== undefined && pack.name === undefined) {
          pack.name = data.name
        }

        if (data.folder !== undefined && pack.folder === undefined) {
          pack.folder = data.folder
        }

        if (pack.name === undefined) {
          pack.name = parseUrl(pack.url).name
        }

        pack.localPath =
          pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name
        pack.filesize = fileSize

        if (data.instruments) {
          pack.instruments = pack.instruments.concat(data.instruments)
        }
        if (data.samplepacks) {
          pack.samplepacks = pack.samplepacks.concat(data.samplepacks)
        }
        if (data.midifiles) {
          pack.midifiles = pack.midifiles.concat(data.midifiles)
        }

        loadLoop(pack, callback)
      }
    })
  } else {
    pack.localPath =
      pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name
    loadLoop(pack, callback)
  }
}

function loadLoop(assetpack, callback) {
  var i,
    assets,
    asset,
    loaded = store(assetpack),
    localPath = assetpack.localPath

  if (loaded === true) {
    assetpack = findItem(localPath, this.storage.assetpacks, true)
    callback(assetpack)
    return
  }

  if (assetpack.url !== undefined) {
    var packs = this.storage.assetpacks,
      tmp,
      p,
      double = null

    for (p in packs) {
      tmp = packs[p]
      if (tmp.className !== 'AssetPack') {
        continue
      }
      if (tmp.id !== assetpack.id && tmp.url === assetpack.url) {
        double = tmp
        break
      }
    }
    if (double !== null) {
      localPath = assetpack.localPath
      removeAssetPack(localPath)

      assetpack = null
      assetpack = findItem(double.localPath, this.storage.assetpacks, true)
      callback(assetpack)
      return
    }
  }

  assets = assetpack.midifiles
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    asset.pack = assetpack
    this.addMidiFile(asset)
  }

  assets = assetpack.instruments
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    asset.pack = assetpack
    this.addInstrument(asset)
  }

  assets = assetpack.samplepacks
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    asset.pack = assetpack
    this.addSamplePack(asset)
  }

  callback(assetpack)
}

AssetPack.prototype.unload = function() {
  var i, assets, asset

  assets = this.midifiles
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    removeMidiFile(asset.folder + '/' + asset.name)
  }

  assets = this.instruments
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    removeInstrument(asset.folder + '/' + asset.name)
  }

  assets = this.samplepacks
  for (i = assets.length - 1; i >= 0; i--) {
    asset = assets[i]
    removeSamplePack(asset.folder + '/' + asset.name)
  }

  deleteItem(this.localPath, storage.assetpacks)
}

export function addAssetPack(config, callback) {
  var type = typeString(config),
    assetpack,
    json,
    name,
    folder

  if (type !== 'object') {
    if (this.debug >= 2) {
      console.warn("can't create an AssetPack with this data", config)
    }
    return false
  }

  if (callback === undefined) {
    callback = function() {}
  }

  if (config.json) {
    json = config.json
    name = config.name
    folder = config.folder
    if (typeString(json) === 'string') {
      try {
        json = JSON.parse(json)
      } catch (e) {
        if (sequencer.debug >= 2) {
          console.warn("can't create an AssetPack with this data", config)
        }
        return false
      }
    }
    if (
      json.instruments === undefined &&
      json.midifiles === undefined &&
      json.samplepacks === undefined
    ) {
      if (sequencer.debug >= 2) {
        console.warn("can't create an AssetPack with this data", config)
      }
      return false
    }
    config = {
      midifiles: json.midifiles,
      instruments: json.instruments,
      samplepacks: json.samplepacks,
      name: name === undefined ? json.name : name,
      folder: folder === undefined ? json.folder : folder
    }
  }
  this.addTask(
    {
      type: 'load asset pack',
      method: load,
      params: new AssetPack(config)
    },
    function(assetpack) {
      config = null
      callback(assetpack)
    },
    true
  )

  sequencer.startTaskQueue()
}
