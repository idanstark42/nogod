
const Main = (module => {
  let $mainContainer, $main, $text, $subtext, $content, version, player

  module.init = async () => {
    initVariables()
    const { events, config } = await Backend.load(version)
    initEvents(events, config)
    initCSS(config)
    if (config['show dots']) {
      Dots.init($main, config)
    }

    $('#loader').fadeOut(500, () => $('#content').fadeIn(500))
    
    $('body').on('keypress', e => {
      // if pressing space, toggle play/pause
      console.debug('[main] key pressed', e.key)
      if (e.key === ' ') {
        player.toggle()
      }
    })
  }

  const initVariables = () => {
    console.debug('[main] init variables')
    $mainContainer = $('#main-container')
    $main = $('#main')
    $text = $('#text')
    $subtext = $('#subtext')
    $content = $('#content')
    version = new URLSearchParams(window.location.search).get('version') || 1
  }

  const initEvents = (events, config) => {
    console.debug('[main] init events')
    const raffle = new Raffle(events, config)

    events = events.map(event => Event.build(event, config))
    raffle.enrich(events)
    $main[0].innerHTML = events.map(event => event.html()).join('')

    player = new Player(raffle, config, $main, $text, $subtext)
    player.init($main)

    const total = events.reduce((acc, event) => acc + event.filesCount, 0)

    const loader = new Loader(total, text => {
      $text[0].innerHTML = text
    }, () => {
      $text[0].innerHTML = ''
      $text.css({ direction: 'rtl' })
    })

    console.debug('[main] loading files')
    setTimeout(() => {
      events.forEach((event) => {
        event.loadFiles(loader, $main)
        event.attachEvents($main, $text, $subtext)
      })
    })

    console.debug('[main] loading fonts')
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