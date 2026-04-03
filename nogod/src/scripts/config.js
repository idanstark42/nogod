const Config = (module => {

  let config

  function getConfigFromUI () {
    const newConfig = {}

    $('input').each((i, el) => {
      const name = el.name
      const value = parseValue(el)
      newConfig[name] = value
    })

    return newConfig
  }
  
  function setConfigToUI () {
    Object.keys(config).forEach(key => {
      if (typeof config[key] === 'boolean') {
        $(`input[name="${key}"]`).prop('checked', config[key])
      } else if (typeof config[key] === 'object' && key.includes('file')) {
        // skip file inputs
      } else {
        $(`input[name="${key}"]`).val(config[key])
      }
    })
  }

  function connectEvents () {
    $('input').on('change input', function (event) {
      const name = event.target.name
      const value = parseValue(event.target)

      config = Object.assign({}, config, getConfigFromUI())
      config[name] = value
      setConfigToUI()
      updateUI()
    })

    $('.toggle .slider').on('click', function (event) {
      const input = $(this).siblings('input')[0]
      $(input).click()
    })
  }

  function updateUI () {
    $('#layout-demo').css({
      backgroundColor: config['deadzone background color']
    })

    $('#layout-demo-main-container').css({
      height: `${config['image area height (%)'] || 50}%`,
      bottom: `${config['image area position (%)'] || 50}%`
    })

    $('#layout-demo-main').css({
      aspectRatio: String(config['map aspect ratio']),
      backgroundColor: config['main background color']
    })

    $('#layout-demo-text').css({
      bottom: `${config['text position (%)'] || 30}%`,
      left: `${(100 - (config['text width (%)'] || 80)) / 2}%`,
      width: `${config['text width (%)'] || 80}%`,
      color: config['text color'],
      backgroundColor: config['text area background color']
    })

    $('#layout-demo-subtext').css({
      bottom: `${config['subtext position (%)'] || 20}%`,
      left: `${(100 - (config['text width (%)'] || 80)) / 2}%`,
      width: `${config['text width (%)'] || 80}%`,
      color: config['text color'],
      backgroundColor: config['text area background color']
    })

    $('#text-demo-text').css({
      color: config['text color'],
      backgroundColor: config['text area background color'],
      lineHeight: `${config['text line height (px)'] || 40}px`,
      fontSize: `${config['text size (px)'] || 30}px`,
      direction: config['direction left-to-right'] ? 'ltr' : 'rtl'
    })

    $('#text-demo-subtext').css({
      color: config['text color'],
      backgroundColor: config['text area background color'],
      lineHeight: `${config['subtext line height (px)'] || 30}px`,
      fontSize: `${config['subtext size (px)'] || 20}px`,
      direction: config['direction left-to-right'] ? 'ltr' : 'rtl'
    })
  }

  function parseValue (input) {
    let value = input.value
    if (input.type === 'number' || input.type === 'range') {
      value = parseFloat(value)
    } else if (input.type === 'file') {
      value = input.files
    } else if (input.type === 'color') {
      value = value.toUpperCase()
    } else if (input.type === 'checkbox') {
      value = input.checked
    }
    return value
  }

  module.init = async () => {
    await Backend.init()
    const version = localStorage.getItem('version')
    config = await Backend.loadConfig(version)
    config = Object.fromEntries(Object.entries(config).filter(([key, value]) => value !== null))
    config = Object.assign({}, window.DEFAULT_CONFIG, config)

    $('.edit-config .title')[0].innerHTML = TITLE_HTML

    $('.edit-config .title .version')[0].innerText = version
    $('.edit-config .title .save').click(async () => {
      await Backend.saveConfig(version, config)
      window.location.hash = ''
      window.location.reload(true)
    })
    $('.edit-config .title .cancel').click(() => {
      window.location.hash = ''
      window.location.reload(true)
    })

    $('.edit-config .fields')[0].innerHTML = FIELDS_HTML
    setTimeout(() => {
      connectEvents()
      config = Object.assign({}, window.DEFAULT_CONFIG, config)
      setConfigToUI()
      updateUI()
    }, 100)

    Dots.init($(document.body), {
      'dots count': 200,
      'dots size': 2,
      'dots speed': 20,
      'dots color': '#FFFFFF'
    })
  }
  
  function input(name, type) {
    if (type === 'number' && name.includes('%')) {
      const label = name.replace('(%)', '(%)')
      return `<div class="percent input">
        <label for="${name}">${label}</label>
        <input type="range" name="${name}" min="0" max="100" step="1">
        <input type="number" name="${name}" min="0" max="100" step="1">
      </div>`
    } else if (type === 'toggle') {
      return `<div class="${type} input">
        <label for="${name}">${name}</label>

        <div class="toggle">
          <input type="checkbox" id="${name}" name="${name}">
          <span class="slider"></span>
        </div>
      </div>`
    }
    
    return `<div class="${type} input">
      <label for="${name}">${name}</label>
      <input type="${type}" id="${name}" name="${name}">
    </div>`
  }

  const TITLE_HTML = `<div class="version"></div>
  <div class="buttons">
    <button class="save">save</button>
    <button class="cancel">cancel</button>
  </div>`

  const FIELDS_HTML = `<div class="box page-layout">
    <h3>Page layout</h3>
    ${input('map aspect ratio', 'number')}
    ${input('image area height (%)', 'number')}
    ${input('image area position (%)', 'number')}
    ${input('text position (%)', 'number')}
    ${input('subtext position (%)', 'number')}
    ${input('text width (%)', 'number')}
    <div id="layout-demo">
      <div id="layout-demo-main-container">
        <div id="layout-demo-main"></div>
      </div>
      <div id="layout-demo-text">text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text</div>
      <div id="layout-demo-subtext">subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext</div>
    </div>
  </div>
  <div class="box timeline">
    <h3>timeline</h3>
    ${input('animation fade duration (sec)', 'number')}
    ${input('animation move duration (sec)', 'number')}
    ${input('animation open duration (sec)', 'number')}
    ${input('animation delay (sec)', 'number')}
    ${input('text time (sec)', 'number')}
    ${input('image time (sec)', 'number')}
    ${input('subtext delay (sec)', 'number')}
    ${input('subtext duration (sec)', 'number')}
    ${input('subtext transition (sec)', 'number')}
    ${input('time between events (sec)', 'number')}
    ${input('time after start screen (sec)', 'number')}
    ${input('wait after points fade (sec)', 'number')}
    ${input('wait after point move (sec)', 'number')}
    ${input('wait after opening (sec)', 'number')}
    ${input('wait before closing (sec)', 'number')}
    ${input('wait after closing (sec)', 'number')}
    ${input('wait after point move back (sec)', 'number')}
  </div>
  <div class="box color-and-audio">
    <h3>colors & audio</h3>
    ${input('audio volume (%)', 'number')}
    ${input('deadzone background color', 'color')}
    ${input('main background color', 'color')}
    ${input('text color', 'color')}
    ${input('text area background color', 'color')}
  </div>
  <div class="box text-design">
    <h3>text design</h3>
    ${input('direction left-to-right', 'toggle')}
    ${input('text line height (px)', 'number')}
    ${input('subtext line height (px)', 'number')}
    ${input('text size (px)', 'number')}
    ${input('subtext size (px)', 'number')}
    <div id="text-demo">
      <div id="text-demo-text">text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text</div>
      <div id="text-demo-subtext">subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext subtext</div>
    </div>
  </div>
  <div class="box moving-points">
    <h3>moving points</h3>
    ${input('show dots', 'toggle')}
    ${input('dots count', 'number')}
    ${input('dots speed', 'number')}
    ${input('dots size', 'number')}
    ${input('dots color', 'color')}
  </div>
  <div class="box event-dots">
    <h3>event dots</h3>
    ${input('move points', 'toggle')}
    ${input('icons rounding (%)', 'number')}
  </div>
  <div class="box start-and-end-screens">
    <h3>Start & end screens</h3>
    ${input('start screen file', 'file')}
    ${input('end screen file', 'file')}
    ${input('start screen duration', 'number')}
    ${input('end screen duration', 'number')}
    ${input('screen fade time', 'number')}
  </div>
  <div class="box raffle">
    <h3>Raffle</h3>
    ${input('min videos', 'number')}
    ${input('max videos', 'number')}
    ${input('min distance between videos', 'number')}
    ${input('raffle files', 'file')} # allow multiple
  </div>`

  module.template = `<div class="edit-config">
    <div class="title segment"></div>
    <div class="fields segment"></div>
  </div>`

  return module

})({})

window.Config = Config

window.DEFAULT_CONFIG = {
  'map aspect ratio': 1.5,
  'image area height (%)': 55,
  'image area position (%)': 35,
  'text position (%)': 15,
  'subtext position (%)': 15,
  'text width (%)': 80,

  'audio volume (%)': 100,
  'text area background color': '#000000',
  'main background color': '#000000',
  'deadzone background color': '#000000',
  'text color': '#FFFFFF',

  'direction left-to-right': false,
  'text line height (px)': 40,
  'subtext line height (px)': 30,
  'text size (px)': 30,
  'subtext size (px)': 20,

  'show dots': true,
  'dots count': 200,
  'dots speed': 20,
  'dots size': 2,
  'dots color': '#FFFFFF',

  'move points': true,
  'icons rounding (%)': 100,

  'start screen duration': 5,
  'end screen duration': 5,
  'screen fade time': 1,

  'min videos': 5,
  'max videos': 20,
  'min distance between videos': 10,

  'animation fade duration (sec)': 1,
  'animation move duration (sec)': 1,
  'animation open duration (sec)': 1,

  'animation delay (sec)': 0.5,
  'text time (sec)': 5,
  'image time (sec)': 5,
  'subtext delay (sec)': 0.5,
  'subtext duration (sec)': 5,
  'subtext transition (sec)': 1,
  'time between events (sec)': 0.5,
  'time after start screen (sec)': 0.5,
  'wait after points fade (sec)': 0.5,
  'wait after point move (sec)': 0.5,
  'wait after opening (sec)': 0.5,
  'wait before closing (sec)': 0.5,
  'wait after closing (sec)': 0.5,
  'wait after point move back (sec)': 0.5
}
