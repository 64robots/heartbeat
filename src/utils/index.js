export function getOs() {
  const ua = navigator.userAgent
  if (ua.match(/(iPad|iPhone|iPod)/g)) {
    return 'ios'
  } else if (ua.indexOf('Android') !== -1) {
    return 'android'
  } else if (ua.indexOf('Linux') !== -1) {
    return 'linux'
  } else if (ua.indexOf('Macintosh') !== -1) {
    return 'osx'
  } else if (ua.indexOf('Windows') !== -1) {
    return 'windows'
  }
  return ''
}

export function getBrowser() {
  const ua = navigator.userAgent

  if (ua.indexOf('Chrome') !== -1) {
    if (ua.indexOf('OPR') !== -1) {
      return 'opera'
    } else if (ua.indexOf('Chromium') !== -1) {
      return 'chromium'
    }
    return 'chrome'
  } else if (ua.indexOf('Safari') !== -1) {
    return 'safari'
  } else if (ua.indexOf('Firefox') !== -1) {
    return 'firefox'
  } else if (ua.indexOf('Trident') !== -1) {
    return 'Internet Explorer'
  }

  if (getOs() === 'ios') {
    if (ua.indexOf('CriOS') !== -1) {
      return 'chrome'
    }
  }
  return ''
}

export function getContext() {
  let context = null
  if (window.AudioContext) {
    context = new window.AudioContext()
  } else if (window.webkitAudioContext) {
    context = new window.webkitAudioContext()
  } else if (window.oAudioContext) {
    context = new window.oAudioContext()
  } else if (window.msAudioContext) {
    context = new window.msAudioContext()
  }
  if (context && context.createGainNode === undefined) {
    context.createGainNode = context.createGain
  }

  return context
}

export function isLegacy() {
  const context = getContext()
  if (!context) {
    return false
  }
  const src = context.createBufferSource()
  return src.start === undefined
}

export function initPolyfills() {
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia

  window.requestAnimationFrame =
    window.requestAnimationFrame || window.webkitRequestAnimationFrame
  window.Blob = window.Blob || window.webkitBlob || window.mozBlob
}
