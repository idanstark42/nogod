const Config = (module => {

  let config

  module.init = async () => {
    await Backend.init()
    const version = localStorage.getItem('version')
    config = await Backend.loadConfig(version)

    $('.edit-config .title')[0].innerText = version

    $('.edit-config .fields')[0].innerHTML = FIELDS_HTML
  }
  
  function input(name, type, value) {
    return `<div class="input">
      <label>${name}</label>
      <input type="${type}" name="${name}" ${type === "checkbox" ? `checked="${Boolean(value)}"` : `value="${value ?? ""}"`}>
    </div>`
  }

  const FIELDS_HTML = `<div class="box">
    <h3>Page layout</h3>
    ${input('map aspect ratio', 'number', 1.5)}
    ${input('map height (px)', 'number', 1701)}
    ${input('image area height (%)', 'number', 55)}
    ${input('image area position (%)', 'number', 35)}
    ${input('text position (%)', 'number', 15)}
    ${input('subtext position (%)', 'number', 15)}
    ${input('text width (%)', 'number', 80)}
  </div>
  <div class="box">
    <h3>timeline</h3>
    ${input('animation fade duration (sec)', 'number', 1)}
    ${input('animation move duration (sec)', 'number', 1)}
    ${input('animation open duration (sec)', 'number', 2)}
    ${input('animation delay (sec)', 'number', 0)}
    ${input('text time (sec)', 'number', 5)}
    ${input('image time (sec)', 'number', 3)}
    ${input('subtext delay (sec)', 'number', 0)}
    ${input('subtext duration (sec)', 'number', 0)}
    ${input('subtext transition (sec)', 'number', 0)}
    ${input('time between events (sec)', 'number', 2)}
    ${input('time after start screen (sec)', 'number', 0)}
    ${input('wait after points fade (sec)', 'number', 3)}
    ${input('wait after point move (sec)', 'number', 0)}
    ${input('wait after opening (sec)', 'number', 1)}
    ${input('wait before closing (sec)', 'number', 1)}
    ${input('wait after closing (sec)', 'number', 1)}
    ${input('wait after point move back (sec)', 'number', 1)}
  </div>
  <div class="box">
    <h3>colors & audio</h3>
    ${input('audio volume (%)', 'number', 100)}
    ${input('text area background color', 'color', '#000000')}
    ${input('main background color', 'color', '#EEEEEE')}
    ${input('deadzone background color', 'color', '#000000')}
    ${input('text color', 'color', '#EEEEEE')}
  </div>
  <div class="box">
    <h3>text design</h3>
    ${input('direction left-to-right', 'toggle', false)}
    ${input('text line height (px)', 'number', 50)}
    ${input('subtext line height (px)', 'number', 30)}
    ${input('text size (px)', 'number', 23)}
    ${input('subtext size (px)', 'number', 25)}
  </div>
  <div class="box">
    <h3>moving points</h3>
    ${input('show dots', 'toggle', true)}
    ${input('dots count', 'number', 200)}
    ${input('dots speed', 'number', 50)}
    ${input('dots size', 'number', 3)}
    ${input('dots color', 'color', '#000000')}
  </div>
  <div class="box">
    <h3>event dots</h3>
    ${input('move points', 'toggle', true)}
    ${input('icons rounding (%)', 'number', 100)}
  </div>
  <div class="box">
    <h3>Start & end screen</h3>
    ${input('start screen file', 'file', 'no god english.jpg')}
    ${input('end screen file', 'file', 'credit.mp4')}
    ${input('start screen duration', 'number', 4)}
    ${input('end screen duration', 'number', 0)}
    ${input('screen fade time', 'number', 1)}
  </div>
  <div class="box">
    <h3>Raffle</h3>
    ${input('min videos', 'number', 0)}
    ${input('max videos', 'number', 0)}
    ${input('min distance between videos', 'number', 0)}
    ${input('raffle files', 'file', '')} # allow multiple
  </div>`

  module.template = `<div class="edit-config">
    <div class="title segment"></div>
    <div class="events segment"></div>
    <div class="fields segment"></div>
  </div>`

  return module

})({})

window.Config = Config
