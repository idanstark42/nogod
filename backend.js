const Backend = (module => {
  const BASE_URL = 'https://script.google.com/macros/s/AKfycbwajVIyGgHj0SZns0mY80cOz1Ca2VQ5Btfg3Z41G1KP9i5hwE7AaCzgSiwrNaFIlyNHog/exec'

  module.load = async (version) => {
    console.debug('[backend] loading data')
    const response = await fetch(`${BASE_URL}?action=load&version=${version}`).then(res => res.json())
    console.debug('[backend] response', response)
    const events = response.events.filter(event => event['enabled'] && event['dot position x (%)'] && event['dot position y (%)'])
    const config = response.config
    return { events, config }
  }

  module.loadFile = async (filename, filetype) => {
    if (!Boolean(filetype)) {
      filetype = module.FILETYPES[filename.split('.')[1]]
      console.debug(`[backend] automatic filetype ${filetype}`)
    }
    console.debug(`[backend] loading file ${filename}`)
    const response = await fetch(`${BASE_URL}?action=get&filetype=${filetype}&filename=${filename}`).then(res => res.text())
    console.debug(`[backend] loaded file ${filename}`)
    return response
  }

  module.getFiletype = filename => {
    return module.FILETYPES[filename.split('.')[1]]
  }

  module.FILETYPES = {
    mp4: 'video',
    png: 'image',
    tiff: 'image',
    jpg: 'image',
    mp3: 'audio'
  }

  return module

})({})