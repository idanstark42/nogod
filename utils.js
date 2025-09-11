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