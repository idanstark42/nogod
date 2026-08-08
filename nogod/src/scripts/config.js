import { open } from "@tauri-apps/plugin-dialog"
import { convertFileSrc } from "@tauri-apps/api/core"

const Config = (module => {
  let config

  // --- Helper Functions to Get/Set Configuration ---
  function getTargetValue(name, eventId) {
    if (eventId) {
      const eventConfig = config.events.find(e => e.id === eventId);
      const rawName = name.replace(`event-${eventId}-`, '');
      return eventConfig ? eventConfig[rawName] : null;
    }
    return config[name];
  }

  function setTargetValue(name, eventId, value) {
    if (eventId) {
      const eventConfig = config.events.find(e => e.id === eventId);
      const rawName = name.replace(`event-${eventId}-`, '');
      if (eventConfig) eventConfig[rawName] = value;
    } else {
      config[name] = value;
    }
  }

  // --- Modal Logic ---
  let currentModalContext = { name: null, eventId: null };

  function openFileModal(name, eventId) {
    currentModalContext = { name, eventId };
    renderModalList();
    $('#file-modal').css('display', 'flex');
  }

  function renderModalList() {
    const { name, eventId } = currentModalContext;
    let val = getTargetValue(name, eventId);
    const files = Array.isArray(val) ? val : (val ? [val] : []);

    let listHtml = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; box-sizing: border-box;">';
    
    files.forEach((f, idx) => {
      const src = convertFileSrc(f);
      const type = Backend.getFiletype(f);
      const filename = f.split('\\').pop().split('/').pop();
      
      let preview = '';
      if (type === 'image') {
        preview = `<img src="${src}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;">`;
      } else if (type === 'video') {
        preview = `<video src="${src}" controls style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;"></video>`;
      } else if (type === 'audio') {
        preview = `<div style="width: 100%; height: 120px; background: #333; display: flex; align-items: center; justify-content: center; border-radius: 4px;"><audio src="${src}" controls style="width: 90%; height: 40px;"></audio></div>`;
      } else {
        preview = `<div style="width: 100%; height: 120px; background: #444; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-size: 12px; color: #fff;">${type}</div>`;
      }

      listHtml += `<div style="display: flex; flex-direction: column; background: #2a2a2a; padding: 10px; border-radius: 6px; box-sizing: border-box; gap: 8px;">
          ${preview}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="flex: 1; word-break: break-all; color: white; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${filename}">${filename}</div>
            <button class="remove-single-file" data-index="${idx}" style="background: #cc0000; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 11px; flex-shrink: 0;">Remove</button>
          </div>
      </div>`;
    });
    
    listHtml += '</div>';

    if (files.length === 0) {
      listHtml = `<div style="color: #aaa; text-align: center; padding: 20px;">No files selected</div>`;
    }

    $('#file-modal .file-list').html(listHtml);
  }


  function getConfigFromUI () {
    const newConfig = { events: [] }

    // Grab global config fields
    $('.edit-config > .content.fields input, .edit-config > .content.fields select, .edit-config > .content.fields textarea').each((i, el) => {
      newConfig[el.name] = parseValue(el)
    })

    // Grab event fields
    $('.event').each((i, el) => {
      const eventId = $(el).data('event-id')
      const eventConfig = { id: eventId }
      $(el).find('input, select, textarea').each((j, input) => {
        const rawName = input.name.replace(`event-${eventId}-`, '')
        eventConfig[rawName] = parseValue(input)
      })
      newConfig.events.push(eventConfig)
    })

    return Object.assign({}, config, newConfig)
  }
  
  function setConfigToUI () {
    // Set Global Config
    Object.keys(config).forEach(key => {
      if (key !== 'events') {
        const el = $(`[name="${key}"]`);
        if (!el.length) return;
        if (typeof config[key] === 'boolean') {
          el.prop('checked', config[key])
        } else if (!el.is('input[type="file"]') && !el.closest('.input.file').length) {
          el.val(config[key])
        }
      }
    })

    // Set Event Config
    config.events.forEach(event => {
      Object.keys(event).forEach(key => {
        const el = $(`[name="event-${event.id}-${key}"]`);
        if (!el.length) return;
        if (typeof event[key] === 'boolean') {
          el.prop('checked', event[key])
        } else if (!el.is('input[type="file"]') && !el.closest('.input.file').length) {
          el.val(event[key])
          
          if (el.parent().hasClass('timed-text')) {
            renderTimedTextGrid(el, event[key]);
          }
        }
      })
    })
  }

  function renderEvents() {
    $('.events-list').html(config.events.map((event, index) => {
      const eventId = event.id || index + 1
      const parent = `event-${eventId}`
      
      return `<div class="event" data-event-id="${eventId}">
        <div class="event-header">
          <span class="id">#${eventId}</span>
          ${input('story', 'text', parent)}
          <div class="toggles">
            ${input('raffle', 'toggle', parent)}
            ${input('enabled', 'toggle', parent)}
          </div>
        </div>
        
        <div class="event-body-columns">
          <div class="text-column">
            ${input('text (split by newline)', 'timed-text', parent)}
          </div>
          
          <div class="settings-column">
            <div class="box">
              ${input('subtext', 'text', parent)}
              <div class="two-col">
                ${input('text font', 'font', parent)}
                ${input('subtext font', 'font', parent)}
                ${input('text delay (sec)', 'number', parent)}
              </div>
            </div>
            
            <div class="box">
              ${input('image files', 'file', parent)}
              ${input('audio file', 'file', parent)}
              <div class="two-col">
                ${input('image width (px)', 'number', parent)}
                ${input('image height (px)', 'number', parent)}
              </div>
            </div>
            
            <div class="box">
              <div class="two-col">
                ${input('dot position x (%)', 'number', parent)}
                ${input('dot position y (%)', 'number', parent)}
                ${input('dot width (px)', 'number', parent)}
                ${input('dot height (px)', 'number', parent)}
                ${input('icon center x (%)', 'number', parent)}
                ${input('icon center y (%)', 'number', parent)}
                ${input('icon width (px)', 'number', parent)}
                ${input('icon height (px)', 'number', parent)}
              </div>
              ${input('dot color', 'color', parent)}
            </div>
          </div>
        </div>
      </div>`
    }).join(''))

    if (config.events.length > 0) {
      $('.no-events').hide()
    } else {
      $('.no-events').show()
    }

    setConfigToUI()
    updateUI()
  }

  function connectEvents () {
    // Add Event Listener
    $('.edit-config').on('click', '.add-event', async function (event) {
      console.log('adding event')
      const newEvent = Object.assign({}, DEFAULT_EVENT)
      newEvent.id = config.events.length > 0 ? Math.max(...config.events.map(e => e.id)) + 1 : 1
      config.events.push(newEvent)
      renderEvents()
    })
    
    // Generic Input Listener (Delegated)
    $('.edit-config').on('change input', 'input, select, textarea', async function (event) {
      const name = event.target.name
      if (!name) return;
      let value = parseValue(event.target)

      const eventRow = $(event.target).closest('.event')
      if (eventRow.length) {
        const eventId = eventRow.data('event-id')
        const eventConfig = config.events.find(e => e.id === eventId)
        const rawName = name.replace(`event-${eventId}-`, '')
        eventConfig[rawName] = value
      } else {
        config[name] = value
      }
      
      updateUI() 
    })

    $('.edit-config').on('click', '.toggle .slider', function (event) {
      const input = $(this).siblings('input')[0]
      $(input).click()
    })

    // Generic File Picker Listener (Delegated)
    $('.edit-config').on('click', '.input.file', async function (event) {
      if ($(event.target).closest('.remove').length) return;
      
      const name = $(this).attr('name')
      const multiple = name.includes('files')

      const eventRow = $(this).closest('.event')
      const eventId = eventRow.length ? eventRow.data('event-id') : null
      const currentFiles = getTargetValue(name, eventId)

      if (multiple && currentFiles && currentFiles.length > 0) {
        openFileModal(name, eventId);
        return;
      }

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
        
        setTargetValue(name, eventId, multiple ? savedPaths : savedPaths[0]);
        updateUI()
      }
    })

    // Generic File Remove Listener (Delegated)
    $('.edit-config').on('click', '.input.file .remove', function (event) {
      event.stopPropagation()
      const name = $(this).closest('.input.file').attr('name')
      const multiple = name.includes('files')

      const eventRow = $(this).closest('.event')
      const eventId = eventRow.length ? eventRow.data('event-id') : null
      
      setTargetValue(name, eventId, multiple ? [] : null)
      updateUI()
    })

    // --- Modal Interactivity ---
    $(document.body).on('click', '.remove-single-file', function() {
      const idx = $(this).data('index');
      const { name, eventId } = currentModalContext;
      let val = getTargetValue(name, eventId);
      
      if (Array.isArray(val)) {
        val.splice(idx, 1);
        setTargetValue(name, eventId, val);
        renderModalList();
        updateUI(); 
      }
    });

    $(document.body).on('click', '#file-modal .add-more-files', async function() {
      let result = await open({
        multiple: true,
        filters: [{ name: 'Media files', extensions: ['mp4', 'png', 'jpg', 'jpeg', 'tiff', 'mp3', 'ogg'] }]
      });

      if (result) {
        if (!Array.isArray(result)) {
          result = [result];
        }
        const savedPaths = [];
        for (const file of result) {
          savedPaths.push(await Backend.saveFile(file));
        }
        
        const { name, eventId } = currentModalContext;
        let val = getTargetValue(name, eventId) || [];
        val = val.concat(savedPaths);
        
        setTargetValue(name, eventId, val);
        renderModalList();
        updateUI();
      }
    });

    $(document.body).on('click', '#file-modal .close-modal', function() {
      $('#file-modal').hide();
    });

    // --- Timed Text Grid Logic ---
    $('.edit-config').on('input', '.timed-row input', function() {
      const grid = $(this).closest('.timed-text-grid');
      const hiddenInput = grid.siblings('input[type="hidden"]');
      
      const newLines = [];
      grid.find('.timed-row').each(function() {
        const time = $(this).find('.time-input').val() || 0;
        const text = $(this).find('.text-input').val() || '';
        newLines.push(`${text} [${time}]`);
      });
      
      hiddenInput.val(newLines.join('\n')).trigger('change');
    });

    $('.edit-config').on('click', '.add-timed-line', function(e) {
      e.preventDefault();
      const grid = $(this).siblings('.timed-text-grid');
      grid.append(`<div class="timed-row">
          <input type="number" class="time-input" step="0.01" value="0" placeholder="Sec">
          <input type="text" class="text-input" value="" placeholder="Line text" dir="auto">
          <button class="remove-timed-line" title="Remove line">X</button>
        </div>`);
      
      grid.find('.time-input').last().trigger('input');
    });

    $('.edit-config').on('click', '.remove-timed-line', function(e) {
      e.preventDefault();
      const grid = $(this).closest('.timed-text-grid');
      $(this).closest('.timed-row').remove();
      
      if (grid.find('.timed-row').length === 0) {
        grid.siblings('input[type="hidden"]').val('').trigger('change');
      } else {
        grid.find('.time-input').first().trigger('input'); 
      }
    });
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

    // --- Dynamic Field Visibility Logic ---
    const showIconsGlobal = !!config['move points'];
    
    $('#input-animation-move-duration-sec, #input-wait-after-point-move-sec, #input-wait-after-point-move-back-sec').css({
      display: showIconsGlobal ? 'flex' : 'none'
    });

    ['start', 'end'].forEach(screen => {
      // if the screen has a file and it's a video, hide the duration field
      const screenFile = config[`${screen} screen file`];
      const isVideo = screenFile && Backend.getFiletype(screenFile) === 'video';
      $(`#input-${screen}-screen-duration`).css('display', isVideo ? 'none' : 'flex');
    })
    
    config.events.forEach(event => {
      const eventId = event.id;
      const isRaffle = !!event['raffle'];
      
      const getWrapper = (name) => {
        const id = `event-${eventId}-${name}`.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '');
        return $(`#input-${id}`);
      };

      // Hide image fields if raffle is enabled
      getWrapper('image files').css('display', isRaffle ? 'none' : '');
      getWrapper('image width (px)').css('display', isRaffle ? 'none' : '');
      getWrapper('image height (px)').css('display', isRaffle ? 'none' : '');

      // Hide icon fields if "move points" is disabled globally
      getWrapper('icon center x (%)').css('display', showIconsGlobal ? '' : 'none');
      getWrapper('icon center y (%)').css('display', showIconsGlobal ? '' : 'none');
      getWrapper('icon width (px)').css('display', showIconsGlobal ? '' : 'none');
      getWrapper('icon height (px)').css('display', showIconsGlobal ? '' : 'none');
    });
    // --------------------------------------

    // Universal File Preview Renderer for Global and Event files
    $('.file-preview').remove()
    
    $('.input.file').each(function() {
      const name = $(this).attr('name');
      const isMultiple = name.includes('files');
      
      const eventRow = $(this).closest('.event');
      const eventId = eventRow.length ? eventRow.data('event-id') : null;
      const val = getTargetValue(name, eventId);
      
      if (val && val.length !== 0) {
        const files = Array.isArray(val) ? val : [val];
        
        if (isMultiple) {
          const previewCount = Math.min(files.length, 4);
          let gridHtml = '<div class="file-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px;">';
          
          for (let i = 0; i < previewCount; i++) {
            const isLast = (i === 3);
            const hasMore = files.length > 4;
            const src = convertFileSrc(files[i]);
            const type = Backend.getFiletype(files[i]);
            
            let mediaHtml = '';
            if (type === 'image') {
              mediaHtml = `<img src="${src}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">`;
            } else if (type === 'video') {
              mediaHtml = `<video src="${src}" controls style="width: 100%; max-height: 100px; object-fit: contain; border-radius: 4px; background: #000;"></video>`;
            } else if (type === 'audio') {
              mediaHtml = `<div style="width: 100%; height: 100px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#444; border-radius:4px;"><audio src="${src}" controls style="width: 90%; height: 40px;"></audio></div>`;
            } else {
              mediaHtml = `<div style="width: 100%; height: 100px; display:flex; align-items:center; justify-content:center; background:#444; border-radius:4px; font-size: 12px; color: #fff;">${type}</div>`;
            }

            if (isLast && hasMore) {
              gridHtml += `<div style="position: relative;">
                ${mediaHtml}
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5em; font-weight: bold; border-radius: 4px;">+${files.length - 3}</div>
              </div>`;
            } else {
              gridHtml += `<div>${mediaHtml}</div>`;
            }
          }
          gridHtml += '</div>';

          $(this).find('.file-name').html(`<span>${files.length} files selected</span>`);
          $(this).append(`<div class="file-preview multiple-preview">${gridHtml}</div>`);
        } else {
          const fileText = files[0].split('\\').pop().split('/').pop();
          $(this).find('.file-name').text(fileText);
          
          const validPreviews = files.map(f => {
            const type = Backend.getFiletype(f);
            if (type === 'image' || type === 'video' || type === 'audio') {
              return filePreview(f);
            }
            return '';
          }).join('');
          
          if (validPreviews) {
            $(this).append(`<div class="file-preview">${validPreviews}</div>`);
          }
        }
      } else {
        $(this).find('.file-name').text('No file chosen');
      }
    });

    $('.input[id*="text"] > input, .input[id*="subtext"] > input').css({ direction: config['direction left-to-right'] ? 'ltr' : 'rtl' })
  }

  function input(name, type, parent) {
    parent = parent ? `${parent}-` : ''
    const id = parent + name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '')
    const displayName = name
    name = parent + name
    
    if (type === 'number' && name.includes('%')) {
      return `<div class="percent input" id="input-${id}">
        <label for="${name}">${displayName}</label>
        <input type="range" id="${id}-range" name="${name}" min="0" max="100" step="1">
        <input type="number" id="${id}-number" name="${name}" min="0" max="100" step="1">
      </div>`
    } else if (type === 'toggle') {
      return `<div class="${type} input" id="input-${id}">
        <label for="${name}">${displayName}</label>
        <div class="toggle">
          <input type="checkbox" id="${id}" name="${name}">
          <span class="slider"></span>
        </div>
      </div>`
    } else if (type === 'file') {
      return `<div class="${type} input" id="input-${id}" name="${name}">
        <label>${displayName}</label>
        <div class="file-name">No file chosen</div>
        <div class="remove">remove</div>
      </div>`
    } else if (type === 'textarea') {
      return `<div class="${type} input" id="input-${id}">
        <label for="${name}">${displayName}</label>
        <textarea id="${id}" name="${name}" rows="3"></textarea>
      </div>`
    } else if (type === 'timed-text') {
      return `<div class="${type} input input-container" id="input-${id}" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; background: #1a1a1a; padding: 1rem; border-radius: 6px; width: 100%; box-sizing: border-box;">
        <label for="${name}" style="font-weight: bold; color: #aaa;">${displayName}</label>
        <input type="hidden" id="${id}" name="${name}">
        <div class="timed-text-grid" style="width: 100%;"></div>
        <button class="add-timed-line">+ Add Line</button>
      </div>`
    }
    
    return `<div class="${type} input" id="input-${id}">
      <label for="${name}">${displayName}</label>
      <input type="${type}" id="${id}" name="${name}">
    </div>`
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
      return `<video src="${fileSrc}" controls alt="preview" style="max-width: 100%; height: auto; object-fit: contain; background: #000;">`
    } else if (filetype === 'audio') {
      return `<audio src="${fileSrc}" controls alt="preview" style="width: 100%; margin-top: 8px;">`
    }
  }

  function parseTimedText(rawStr) {
    if (!rawStr) return [];
    const lines = rawStr.split('\n');
    const result = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const match = line.match(/^(.*?)\s*\[([\d.]+)\]\s*$/);
      if (match) {
        result.push({ text: match[1].trim(), time: match[2] });
      } else {
        result.push({ text: line, time: 0 }); 
      }
    }
    return result;
  }

  function renderTimedTextGrid(hiddenInput, rawText) {
    const container = hiddenInput.siblings('.timed-text-grid');
    const lines = parseTimedText(rawText || '');
    let html = '';
    lines.forEach((line) => {
      html += `<div class="timed-row">
        <input type="number" class="time-input" step="0.01" value="${line.time}" placeholder="Sec">
        <input type="text" class="text-input" value="${line.text.replace(/"/g, '&quot;')}" placeholder="Line text" dir="auto">
        <button class="remove-timed-line" title="Remove line">X</button>
      </div>`;
    });
    container.html(html);
  }

  module.init = async () => {
    await Backend.init()
    const version = localStorage.getItem('version')
    config = await Backend.loadConfig(version)
    config = Object.fromEntries(Object.entries(config).filter(([key, value]) => value !== null))
    config = Object.assign({}, window.DEFAULT_CONFIG, config)
    console.log(config)

    // Append Modal to Document Body
    if (!$('#file-modal').length) {
      $(document.body).append(MODAL_HTML);
    }

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
    $('.edit-config .title .delete').click(async () => {
      await Backend.renameConfig(version, `deleted-${version}`)
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
      renderEvents()
    }, 100)

    Dots.init($(document.body), {
      'dots count': 200,
      'dots size': 2,
      'dots speed': 20,
      'dots color': '#FFFFFF'
    })
  }

  const TITLE_HTML = `<div class="version"></div>
  <div class="tabs">
    <button class="events active">events</button>
    <button class="fields">config</button>
  </div>
  <div class="buttons">
    <button class="save">save</button>
    <button class="cancel">cancel</button>
    <button class="delete">delete</button>
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

  const EVENTS_HTML = `
    <div class="events-list"></div>
    <div class="no-events">No events yet. Click "Add event" to create one.</div>
    <button class="add-event">Add event</button>`

  const MODAL_HTML = `<div id="file-modal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.8); align-items:center; justify-content:center;">
    <div class="modal-content" style="background:#222; padding:20px; border-radius:8px; width:80%; max-width:700px; max-height:80vh; display:flex; flex-direction:column; box-sizing: border-box;">
      <h3 style="margin-top:0; color:white;">Manage Files</h3>
      <div class="file-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; margin-bottom:15px; padding-right:10px; box-sizing: border-box;"></div>
      <div style="display:flex; justify-content:space-between;">
        <button class="add-more-files" style="padding:10px 15px; cursor:pointer;">Add Files</button>
        <button class="close-modal" style="padding:10px 15px; cursor:pointer;">Close</button>
      </div>
    </div>
  </div>`;

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

window.DEFAULT_EVENT = {
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