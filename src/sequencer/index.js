import { getOs, getBrowser, getContext, isLegacy } from '../utils'
import {
  removeMidiFile,
  removeInstrument,
  removeSamplePack,
  removeAssetPack,
  startTaskQueue,
  addTask,
  addCallbackAfterTask,
  getInstrument,
  getMidiFile,
  getSamplePack,
  getSample,
  getAssetPack,
  getSamplePacks,
  getAssetPacks,
  getSamples,
  getInstruments,
  getMidiFiles
} from './asset_manager'
import { addAssetPack } from './assetpack'
import { encodeAudio } from './audio_encoder'

const context = getContext()
const compressor = context.createDynamicsCompressor()
compressor.connect(context.destination)

const gainNode = context.createGainNode()
gainNode.connect(context.destination)
gainNode.gain.value = 1

const initMethods = []
const compressorParams = [
  'threshold',
  'knee',
  'ratio',
  'reduction',
  'attack',
  'release'
]
var webaudioUnlocked = false
var sampleIndex = 0 // I dont know yet why this is needed

const protectedScope = {
  context,
  masterGainNode: gainNode,
  masterCompressor: compressor,
  useDelta: false,
  timedTasks: {},
  scheduledTasks: {},
  repetitiveTasks: {},
  getSampleId: function() {
    return 'S' + sampleIndex++ + new Date().getTime()
  },

  addInitMethod: function(method) {
    initMethods.push(method)
  },

  callInitMethods: function() {
    for (let i = 0; i < initMethods.length; i++) {
      initMethods[i]()
    }
  }
}

const sequencer = {
  name: 'qambi',
  protectedScope,
  ui: {},
  ua: navigator.userAgent,
  os: getOs(),
  browser: getBrowser(),
  legacy: isLegacy(),
  midi: false,
  webmidi: false,
  webaudio: true,
  jazz: false,
  ogg: false,
  mp3: false,
  record_audio: navigator.getUserMedia !== undefined,
  bitrate_mp3_encoding: 128,
  util: {},
  debug: 4, // 0 = off, 1 = error, 2 = warn, 3 = info, 4 = log
  defaultInstrument: 'sinewave',
  pitch: 440,
  bufferTime: 350 / 1000, //seconds
  autoAdjustBufferTime: false,
  noteNameMode: 'sharp',
  minimalSongLength: 60000, //millis
  pauseOnBlur: false,
  restartOnFocus: true,
  defaultPPQ: 960,
  overrulePPQ: true,
  precision: 3, // means float with precision 3, e.g. 10.437
  midiInputs: {},
  midiOutputs: {},
  storage: {
    midi: {
      id: 'midi'
    },
    audio: {
      id: 'audio',
      recordings: {}
    },
    instruments: {
      id: 'instruments'
    },
    samplepacks: {
      id: 'samplepacks'
    },
    assetpacks: {
      id: 'assetpacks'
    }
  },

  activesongs: {},

  getAudioContext: function() {
    return context
  },

  getTime: function() {
    return context.currentTime
  },

  setMasterVolume: function(value) {
    value = value < 0 ? 0 : value > 1 ? 1 : value
    gainNode.gain.value = value
  },

  getMasterVolume: function() {
    return gainNode.gain.value
  },

  getCompressionReduction: function() {
    return compressor.reduction.value
  },

  enableMasterCompressor: function(flag) {
    if (flag) {
      gainNode.disconnect(0)
      gainNode.connect(compressor)
      compressor.disconnect(0)
      compressor.connect(context.destination)
    } else {
      compressor.disconnect(0)
      gainNode.disconnect(0)
      gainNode.connect(context.destination)
    }
  },

  configureMasterCompressor: function(cfg) {
    /*
        readonly attribute AudioParam threshold; // in Decibels
        readonly attribute AudioParam knee; // in Decibels
        readonly attribute AudioParam ratio; // unit-less
        readonly attribute AudioParam reduction; // in Decibels
        readonly attribute AudioParam attack; // in Seconds
        readonly attribute AudioParam release; // in Seconds
    */
    for (let i = compressorParams.length; i >= 0; i--) {
      const param = compressorParams[i]
      if (cfg[param] !== undefined) {
        compressor[param].value = cfg[param]
      }
    }
  },

  unlockWebAudio: function() {
    if (webaudioUnlocked) {
      return
    }
    if (typeof context.resume === 'function') {
      context.resume()
    }
    const src = context.createOscillator()
    const gainNode = context.createGainNode()
    gainNode.gain.value = 0
    src.connect(gainNode)
    gainNode.connect(context.destination)
    if (src.noteOn !== undefined) {
      src.start = src.noteOn
      src.stop = src.noteOff
    }
    src.start(0)
    src.stop(0.001)
    webaudioUnlocked = true
  },

  updateInstruments: function() {
    for (let i in this.activeSongs) {
      if (activeSongs.hasOwnProperty(i)) {
        const song = activeSongs[i]
        const tracks = song.tracks
        for (let j = tracks.length - 1; j >= 0; j--) {
          const track = tracks[j]
          track.instrument.reset()
        }
      }
    }
  },

  // asset_manager
  removeMidiFile,
  removeInstrument,
  removeSamplePack,
  removeAssetPack,
  startTaskQueue,
  addTask,
  addCallbackAfterTask,
  getInstrument,
  getMidiFile,
  getSamplePack,
  getSample,
  getAssetPack,
  getSamplePacks,
  getAssetPacks,
  getSamples,
  getInstruments,
  getMidiFiles,

  // assetpack
  addAssetPack,

  // audio_encoder
  encodeAudio
}

export default sequencer

// debug levels ?
// Object.defineProperty(sequencer, 'ERROR', { value: 1 })
// Object.defineProperty(sequencer, 'WARN', { value: 2 })
// Object.defineProperty(sequencer, 'INFO', { value: 3 })
// Object.defineProperty(sequencer, 'LOG', { value: 4 })
