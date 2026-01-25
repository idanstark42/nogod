window.wait = async ms => new Promise(resolve => setTimeout(resolve, ms))

window.until = (condition, throttle = 10) => {
  return new Promise(resolve => {

    const next = () => {
      if (condition()) {
        resolve()
      } else {
        setTimeout(next, throttle)
      }
    }

    next()
  })
}

window.nothing = () => {
  console.debug('[nothing]')
}
window.iterate = (arr, func, times, repeat=false, index=0, iterationManager={ stop: false }) => {
  if (iterationManager.stop) {
    return
  }
  
  if (index >= arr.length) {
    if (repeat) {
      index = 0
    } else {
      if (iterationManager.onDone) {
        iterationManager.onDone()
      }
      return
    }
  }

  func(arr[index])
  iterationManager.timeout = setTimeout(() => iterate(arr, func, times, repeat, index + 1, iterationManager), times[index] * 1000)
  return iterationManager
}

window.Throttle = (func, delay) => {
  let timeout = null
  return (...args) => {
    if (!timeout) {
      func(...args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  }
}
