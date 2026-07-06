import { open } from "@tauri-apps/plugin-dialog"
import { convertFileSrc } from "@tauri-apps/api/core"

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
      } else {
        $(`input[name="${key}"]`).val(config[key])
      }
    })
  }

  function connectEvents () {
    $('.add-event').on('click', async function (event) {
      console.log('adding event')
      const newEvent = Object.assign({}, DEFAULT_EVENT)
      newEvent.id = config.events.length > 0 ? Math.max(...config.events.map(e => e.id)) + 1 : 1
      config.events.push(newEvent)
      updateUI()
    })
    
    $('input').on('change input', async function (event) {
      const name = event.target.name
      let value = parseValue(event.target)

      config = Object.assign({}, config, getConfigFromUI())
      config[name] = value
      setConfigToUI()
      updateUI()
    })

    $('.toggle .slider').on('click', function (event) {
      const input = $(this).siblings('input')[0]
      $(input).click()
    })

    $('.input.file').on('click', async function (event) {
      const name = $(this).attr('name')
      const multiple = name.includes('files')

      let result = await open({
        multiple,
        filters: [{ name: 'Media files', extensions: ['mp4', 'png', 'jpg', 'jpeg', 'tiff', 'mp3', 'ogg'] }]
      })

      if (result) {
        if (!Array.isArray(result)) {
          result = [result]
        }
        const savedPaths = []
        for (const file of result) {
          savedPaths.push(await Backend.saveFile(file))
        }
        $(this).find('.file-name').text(savedPaths.length > 1 ? `${savedPaths.length} files` : savedPaths[0])
        config[name] = multiple ? savedPaths : savedPaths[0]
        updateUI()
      }
    })

    $('.input.file .remove').on('click', function (event) {
      event.stopPropagation()
      const name = $(this).parent().attr('name')
      const multiple = name.includes('files')

      $(this).siblings('.file-name').text('No file chosen')
      config[name] = multiple ? [] : null
      updateUI()
    })
  }

  function updateUI () {
    console.log(config)
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

    $('#input-animation-move-duration-sec, #input-wait-after-point-move-sec, #input-wait-after-point-move-back-sec').css({
      display: config['move points'] ? 'flex' : 'none'
    })

    $('.file-preview').remove()
    
    const screens = ['start', 'end']
    screens.forEach(screen => {
      $(`#input-${screen}-screen-duration`).css({
        display: typeof(config[`${screen} screen file`]) === 'string' && Backend.getFiletype(config[`${screen} screen file`]) === 'image' ? 'flex' : 'none'
      })

      if(typeof(config[`${screen} screen file`]) === 'string') {
        $(`#input-${screen}-screen-file .file-name`).text(config[`${screen} screen file`].split('\\').pop())
        $(`#input-${screen}-screen-file`).append(`<div class="file-preview">
          ${filePreview(config[`${screen} screen file`])}
        </div>`)
      }
    })

    $('.events-list').html(config.events.map((event, index) => {
      const eventId = event.id || index + 1
      return `<div class="event" data-event-id="${eventId}">
        <div class="event-header">
          <div class="event-title">Event ${eventId}</div>
        </div>
      </div>`
    }).join(''))

    if (config.events.length > 0) {
      $('.no-events').hide()
    }
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

  const filePreview = file => {
    const fileSrc = convertFileSrc(file)
    const filetype = Backend.getFiletype(file)
    if (filetype === 'image') {
      return `<img src="${fileSrc}" alt="preview">`
    } else if (filetype === 'video') {
      return `<video src="${fileSrc} alt="preview>`
    }
  }

  module.init = async () => {
    await Backend.init()
    const version = localStorage.getItem('version')
    config = await Backend.loadConfig(version)
    config = Object.fromEntries(Object.entries(config).filter(([key, value]) => value !== null))
    config = Object.assign({}, window.DEFAULT_CONFIG, config)
    console.log(config)

    $('.edit-config .title')[0].innerHTML = TITLE_HTML

    $('.edit-config .title .version')[0].innerText = version
    $('.edit-config .title .tabs button').click(function () {
      const tab = $(this).attr('class')
      $('.edit-config .title .tabs button').removeClass('active')
      $(this).addClass('active')
      $('.edit-config .content').removeClass('active')
      $(`.edit-config .content.${tab}`).addClass('active')
    })
    $('.edit-config .title .save').click(async () => {
      await Backend.saveConfig(version, config)
      window.location.hash = ''
      window.location.reload(true)
    })
    $('.edit-config .title .cancel').click(() => {
      window.location.hash = ''
      window.location.reload(true)
    })

    $('.edit-config .fields.content')[0].innerHTML = FIELDS_HTML
    $('.edit-config .events.content')[0].innerHTML = EVENTS_HTML
    
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
    const id = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '')
    if (type === 'number' && name.includes('%')) {
      return `<div class="percent input" id="input-${id}">
        <label for="${name}">${name}</label>
        <input type="range" id="${id}-range" name="${name}" min="0" max="100" step="1">
        <input type="number" id="${id}-number" name="${name}" min="0" max="100" step="1">
      </div>`
    } else if (type === 'toggle') {
      return `<div class="${type} input" id="input-${id}">
        <label for="${name}">${name}</label>

        <div class="toggle">
          <input type="checkbox" id="${id}" name="${name}">
          <span class="slider"></span>
        </div>
      </div>`
    } else if (type === 'file') {
      return `<div class="${type} input" id="input-${id}" name="${name}">
        <label>${name}</label>
        <div class="file-name">No file chosen</div>
        <div class="remove">remove</div>
      </div>`
    }
    
    return `<div class="${type} input" id="input-${id}">
      <label for="${name}">${name}</label>
      <input type="${type}" id="${id}" name="${name}">
    </div>`
  }

  const TITLE_HTML = `<div class="version"></div>
  <div class="tabs">
    <button class="events active">events</button>
    <button class="fields">config</button>
  </div>
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
    ${input('move points', 'toggle')}
    ${input('time after start screen (sec)', 'number')}
    ${input('animation fade duration (sec)', 'number')}
    ${input('wait after points fade (sec)', 'number')}
    ${input('animation move duration (sec)', 'number')}
    ${input('wait after point move (sec)', 'number')}
    ${input('animation open duration (sec)', 'number')}
    ${input('wait after opening (sec)', 'number')}

    ${input('subtext delay (sec)', 'number')}
    ${input('subtext duration (sec)', 'number')}
    ${input('subtext transition (sec)', 'number')}

    ${input('text time (sec)', 'number')}
    ${input('image time (sec)', 'number')}
    ${input('wait before closing (sec)', 'number')}
    ${input('wait after closing (sec)', 'number')}
    ${input('wait after point move back (sec)', 'number')}

    ${input('time between events (sec)', 'number')}
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
    <h3>moving dots</h3>
    ${input('icons rounding (%)', 'number')}
    ${input('show dots', 'toggle')}
    ${input('dots count', 'number')}
    ${input('dots speed', 'number')}
    ${input('dots size', 'number')}
    ${input('dots color', 'color')}
  </div>
  <div class="box start-and-end-screens">
    <h3>Start & end screens</h3>
    ${input('screen fade time (sec)', 'number')}
    ${input('start screen file', 'file')}
    ${input('start screen duration', 'number')}
    ${input('end screen file', 'file')}
    ${input('end screen duration', 'number')}
  </div>
  <div class="box raffle">
    <h3>Raffle</h3>
    ${input('min videos', 'number')}
    ${input('max videos', 'number')}
    ${input('min distance between videos', 'number')}
    ${input('raffle files', 'file')} # allow multiple
  </div>`

  const EVENTS_HTML = `<div class="box events">
    <h3>Events</h3>
    <div class="events-list"></div>
    <div class="no-events">No events yet. Click "Add event" to create one.</div>
    <button class="add-event">Add event</button>
  </div>`

  module.template = `<div class="edit-config">
    <div class="title segment"></div>
    <div class="events active content segment"></div>
    <div class="fields content segment"></div>
  </div>`

  return module

})({})

window.Config = Config

window.DEFAULT_CONFIG = {
  'events': [],
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
  'screen fade time (sec)': 1,

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

// id text number	text story	image files	audio file	dot position x (%)	dot position y (%)	dot width (px)	dot height (px)	icon center x (cm)	icon center y (cm)	icon width (px)	icon height (px)	image width (px)	image height (px)	text (split by newline)	text delay (sec)	icon center x (%)	icon center y (%)	dot location (x)	dot location (%x of 90cm)	dot location (y) 	dot location (%x of 60cm)	dot color	subtext	text font	subtext font	raffle	enabled
const DEFAULT_EVENT = {
  'id': undefined,
  'text story': '',
  'text': '',
  'image files': [],
  'audio file': null,
  'dot position x (%)': 50,
  'dot position y (%)': 50,
  'dot width (px)': 10,
  'dot height (px)': 10,
  'icon center x (cm)': 45,
  'icon center y (cm)': 30,
  'icon width (px)': 10,
  'icon height (px)': 10,
  'image width (px)': 1920,
  'image height (px)': 1080,
  'text delay (sec)': 0,
  'icon center x (%)': 50,
  'icon center y (%)': 50,
  'dot location (x)': 45,
  'dot location (%x of 90cm)': 50,
  'dot location (y)': 30,
  'dot location (%x of 60cm)': 50,
  'dot color': '#FFFFFF',
  'subtext': '',
  'text font': 'Arial',
  'subtext font': 'Arial',
  'raffle': false,
  'enabled': true
}