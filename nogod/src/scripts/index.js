import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"

const Index = (module => {
  async function loadConfigs() {
    await Backend.init()
    const listDiv = document.getElementById("config-list")
    listDiv.innerHTML = ""

    const configs = await Backend.listConfigs()

    if (configs.length === 0) {
      listDiv.innerHTML = `<div class="no-config">No versions available yet. Create a new one.</div>`
    } else {
      listDiv.innerHTML = configs.filter(config => !(config.startsWith('deleted-'))).map(config => `<div class="config segment" version="${config}">
        <div class="name">${config}</div>
        <div class="run">run</div>
        <div class="edit">edit</div>
      </div>`).join('')
    }

    $('.config .run').off('click').on('click', run)
    $('.config .edit').off('click').on('click', edit)
  }

  async function createNew() {
    const name = prompt("Enter new config name:")
    if (!name) return
    await Backend.createConfig(name)
    await loadConfigs()
  }

  async function importFromCSV() {
    const name = prompt("Enter name for the new imported version:")
    if (!name) return

    let configData = {}
    let eventsData = []

    // 1. Load Config CSV
    const configPath = await open({
      title: "Select Config CSV (Cancel to skip)",
      multiple: false,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (configPath) {
      const text = await readTextFile(configPath)
      const rows = CSV.parse(text)
      
      // Assumes key is column 0, value is column 1
      rows.forEach(row => {
        if (row.length >= 2) {
          const key = row[0].trim()
          const val = row[1].trim()
          configData[key] = CSV.castValue(key, val, window.DEFAULT_CONFIG || {})
        }
      })
    }

    // 2. Load Events CSV
    const eventsPath = await open({
      title: "Select Events CSV (Cancel to skip)",
      multiple: false,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (eventsPath) {
      const text = await readTextFile(eventsPath)
      const rows = CSV.parse(text)
      
      if (rows.length > 1) {
        const headers = rows[0].map(h => h.trim())
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const eventObj = Object.assign({}, window.DEFAULT_EVENT || {})
          
          headers.forEach((header, index) => {
            if (index < row.length) {
               eventObj[header] = CSV.castValue(header, row[index].trim(), eventObj)
            }
          })
          
          // Ensure events have an ID
          if (!eventObj.id) eventObj.id = i
          eventsData.push(eventObj)
        }
      }
    }

    // 3. Merge and Save
    const finalConfig = Object.assign({}, window.DEFAULT_CONFIG || {}, configData)
    finalConfig.events = eventsData

    await Backend.createConfig(name)
    await Backend.saveConfig(name, finalConfig)
    await loadConfigs()
  }

  async function run (event) {
    const version = $(event.target).parent().attr('version')
    localStorage.setItem('version', version)
    window.location.hash = 'Nogod'
    window.location.reload(true)
  }

  async function edit (event) {
    const version = $(event.target).parent().attr('version')
    localStorage.setItem('version', version)
    window.location.hash = 'Config'
    window.location.reload(true)
  }

  module.init = async () => {
    await loadConfigs()
    const createBtn = document.getElementById("create-new")
    createBtn.onclick = createNew

    const importBtn = document.getElementById("import-csv")
    importBtn.onclick = importFromCSV

    Dots.init($(document.body), {
      'dots count': 400,
      'dots size': 2,
      'dots speed': 20,
      'dots color': '#FFFFFF'
    })
  }

  module.template = `<div class="index segment">
    <h1>Available Versions</h1>
    <div id="config-list"></div>
    <div class="buttons">
      <button id="create-new">Create New Version</button>
      <button id="import-csv">Add from CSV</button>
    </div>
  </div>`

  return module

})({})

window.Index = Index