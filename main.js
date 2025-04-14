const Main = (module => {
  let $mainContainer, $main, $text, $subtext, $content, version

  module.init = async () => {
    initVariables()
    const { events, config } = await Backend.load(version)
    initEvents(events, config)
    initCSS(config)
    if (config['show dots']) {
      Dots.init($main, config)
    }

    $('#loader').fadeOut(500, () => $('#content').fadeIn(500))
  }

  const initVariables = () => {
    $mainContainer = $('#main-container')
    $main = $('#main')
    $text = $('#text')
    $subtext = $('#subtext')
    $content = $('#content')
    version = new URLSearchParams(window.location.search).get('version') || 1
  }

  const initEvents = (events, config) => {
    $main[0].innerHTML = events.map(event => Event.html(event, config)).join('')

    const total = events.length + events.reduce((acc, event) => acc + event['image files'].split('\n').filter(imageFile => imageFile.length > 0).length, 0)
    const loader = new Loader(total, text => {
      $text[0].innerHTML = text
    }, () => {
      $text[0].innerHTML = ''
      $text.css({ direction: 'rtl' })
    })

    setTimeout(() => {
      events.forEach((event) => {
        Event.loadFiles(event, config, loader, $main, $text, $subtext)
      })
    })

    // load google font for each event
    events
      .reduce((acc, event) => acc.concat([event['text font'], event['subtext font']]), [])
      .forEach(font => Font.importFromGoogle(font))
  }

  const initCSS = config => {
    $mainContainer.css({
      height: `${config['image area height (%)'] || 50}%`,
      bottom: `${config['image area position (%)'] || 50}%`
    })

    $main.css({
      backgroundColor: config['main background color'],
      aspectRatio: String(config['map aspect ratio']),
      transitionDuration: '1s'
    })

    $text.css({
      bottom: `${config['text position (%)'] || 30}%`,
      color: config['text color'] || 'black',
      fontSize: `${config['text size (px)'] || 20}px`,
      backgroundColor: config['text area background color'] || 'white',
    })

    $subtext.css({
      bottom: `${config['subtext position (%)'] || 20}%`,
      color: config['text color'] || 'black',
      fontSize: `${config['subtext size (px)'] || 15}px`,
      backgroundColor: config['text area background color'] || 'white',
      opacity: 0,
      transition: `opacity ${config['subtext transition (sec)']}s linear`
    })

    $content.css({ backgroundColor: config['deadzone background color'] })
  }

  return module

})({})