window.wait = async ms => new Promise(resolve => setTimeout(resolve, ms))

window.execute = (actions) => {
  const doblet = actions.shift()
  if (!doblet) {
    return
  }
  const [action, time] = doblet
  setTimeout(() => {
    action()
    execute(actions)
  }, time)
}

window.nothing = () => {
  console.debug('[nothing]')
}