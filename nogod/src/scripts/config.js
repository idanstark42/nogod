const Config = (module => {

  let config

  function getConfigFromUI () {
    const config = {}
    return config
  }
  
  function setConfigToUI (config) {
    config = Object.assign({}, config, DEFAULT_CONFIG)

    Object.keys(config).forEach(key => {
      $(`input[name="${key}"]`).val(config[key])
    })

    $('#layout-demo-main-container').css({
      height: `${config['image area height (%)'] || 50}%`,
      bottom: `${config['image area position (%)'] || 50}%`
    })

    $('#layout-demo-main').css({
      aspectRatio: String(config['map aspect ratio'])
    })

    $('#layout-demo-text').css({
      bottom: `${config['text position (%)'] || 30}%`
    })

    $('#layout-demo-subtext').css({
      bottom: `${config['subtext position (%)'] || 20}%`
    })
  }

  module.init = async () => {
    await Backend.init()
    const version = localStorage.getItem('version')
    config = await Backend.loadConfig(version)

    $('.edit-config .title')[0].innerHTML = TITLE_HTML

    $('.edit-config .title .version')[0].innerText = version
    $('.edit-config .title .save').click(async () => {
      await Backend.saveConfig(version, getConfigFromUI())
      window.location.hash = ''
      window.location.reload(true)
    })
    $('.edit-config .title .cancel').click(() => {
      window.location.hash = ''
      window.location.reload(true)
    })

    $('.edit-config .fields')[0].innerHTML = FIELDS_HTML
    setConfigToUI(config)

    Dots.init($(document.body), {
      'dots count': 200,
      'dots size': 2,
      'dots speed': 20,
      'dots color': '#FFFFFF'
    })
  }
  
  function input(name, type) {
    return `<div class="input">
      <label>${name}</label>
      <input type="${type}" name="${name}">
    </div>`
  }

  const TITLE_HTML = `<div class="version"></div>
  <div class="buttons">
    <button class="cancel">save</button>
    <button class="save">cancel</button>
  </div>`

  const FIELDS_HTML = `<div class="box page-layout">
    <h3>Page layout</h3>
    ${input('map aspect ratio', 'number')}
    ${input('map height (px)', 'number')}
    ${input('image area height (%)', 'number')}
    ${input('image area position (%)', 'number')}
    ${input('text position (%)', 'number')}
    ${input('subtext position (%)', 'number')}
    ${input('text width (%)', 'number')}
    <div id="layout-demo">
      <div id="layout-demo-main-container">
        <div id="layout-demo-main"></div>
      </div>
      <div id="layout-demo-text"></div>
      <div id="layout-demo-subtext"></div>
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
    ${input('text area background color', 'color')}
    ${input('main background color', 'color')}
    ${input('deadzone background color', 'color')}
    ${input('text color', 'color')}
  </div>
  <div class="box text-design">
    <h3>text design</h3>
    ${input('direction left-to-right', 'toggle')}
    ${input('text line height (px)', 'number')}
    ${input('subtext line height (px)', 'number')}
    ${input('text size (px)', 'number')}
    ${input('subtext size (px)', 'number')}
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
    <div class="events segment"></div>
    <div class="fields segment"></div>
  </div>`

  return module

})({})

window.Config = Config

window.DEFAULT_CONFIG = {
  'map aspect ratio': 1.5,
  'map height (px)': 1701,
  'image area height (%)': 55,
  'image area position (%)': 35,
  'text position (%)': 15,
  'subtext position (%)': 15,
  'text width (%)': 80
}
