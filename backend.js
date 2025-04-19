const Backend = (module => {
  const BASE_URL = 'https://script.google.com/macros/s/AKfycbzfa_gDtyAX-mU5nG68kl4yQrXAPpDLqihmFUNJhVxwMaWKC2NveUEiP-ygeQDsOw7TIQ/exec'

  module.load = async (version) => {
    console.debug('[backend] loading data')
    const response = await fetch(`${BASE_URL}?action=load&version=${version}`).then(res => res.json())
    console.debug('[backend] response', response)
    const events = response.events.filter(event => event['enabled'] && event['dot position x (%)'] && event['dot position y (%)'])
    const config = response.config
    return { events, config }
  }

  module.loadFile = async (filename, filetype) => {
    console.debug(`[backend] loading file ${filename}`)
    const response = await fetch(`${BASE_URL}?action=get&filetype=${filetype}&filename=${filename}`).then(res => res.text())
    console.debug(`[backend] loaded file ${filename}`)
    return response
  }

  return module

})({})