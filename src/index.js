import { getOs, getBrowser, getContext, initPolyfills } from './utils'

let sequencer

if (!getContext()) {
  const browser = getBrowser()

  sequencer = {
    browser,
    os: getOs(),
    ready(cb) {
      cb()
    }
  }
  alert(
    `The WebAudio API hasn't been implemented in ${browser}, please use any other browser`
  )
} else {
  initPolyfills()

  sequencer = require('./sequencer/index')
}

export default sequencer
