import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile, readDir } from "@tauri-apps/plugin-fs"

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
        <div class="duplicate">duplicate</div>
      </div>`).join('')
    }

    $('.config .run').off('click').on('click', run)
    $('.config .edit').off('click').on('click', edit)
    $('.config .duplicate').off('click').on('click', duplicateConfig)
  }

  async function createNew() {
    const name = prompt("Enter new config name:")
    if (!name) return
    await Backend.createConfig(name)
    await loadConfigs()
  }

  async function duplicateConfig(event) {
    const sourceVersion = $(event.target).parent().attr('version')
    const newName = prompt(`Enter name for the duplicated version (copy of ${sourceVersion}):`)
    if (!newName) return

    try {
      const sourceConfig = await Backend.loadConfig(sourceVersion)
      await Backend.createConfig(newName)
      await Backend.saveConfig(newName, sourceConfig)
      await loadConfigs()
    } catch (err) {
      console.error("Failed to duplicate configuration:", err)
      alert("Error duplicating configuration. Check console for details.")
    }
  }

  function applyBackwardCompatibility (config) {
    if (config['screen fade time']) {
      config['screen fade time (sec)'] = Number(config['screen fade time'])
    }
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
      
      rows.forEach(row => {
        if (row.length >= 2) {
          const key = row[0].trim()
          const val = row[1].trim()
          configData[key] = CSV.castValue(key, val, window.DEFAULT_CONFIG || {})
        }
      })
      applyBackwardCompatibility(configData)
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
          
          if (!eventObj.id) eventObj.id = i
          eventsData.push(eventObj)
        }
      }
    }

    // 3. Select folder and recursively scan all subfolders strictly mapping file names
    const selectedFolder = await open({
      directory: true,
      multiple: false,
      title: "Select folder containing your media files (Cancel to pick files manually)"
    });

    let folderFilesMap = new Map();
    
    async function scanDirectory(dirPath) {
      try {
        const entries = await readDir(dirPath);
        for (const entry of entries) {
          const entryName = entry.name;
          const fullPath = `${dirPath}/${entryName}`;
          
          // Determine if it's a directory or file reliably
          const isDir = entry.isDirectory || (!entry.isFile && !entryName.includes('.'));
          
          if (isDir) {
            await scanDirectory(fullPath);
          } else {
            // Map strictly by file name (ignoring absolute path/subfolders)
            folderFilesMap.set(entryName.toLowerCase(), fullPath);
          }
        }
      } catch (err) {
        console.error(`Failed to scan directory: ${dirPath}`, err);
      }
    }

    if (selectedFolder) {
      await scanDirectory(selectedFolder);
    }

    // Cache to prevent asking for the same file name multiple times
    const fileCache = new Map();

    async function resolveFile(filename) {
      const cleanName = filename.split(/[/\\]/).pop().trim();
      if (!cleanName) return null;

      if (fileCache.has(cleanName.toLowerCase())) {
        return fileCache.get(cleanName.toLowerCase());
      }

      let sourcePath = null;

      // Match strictly by file name across all subdirectories
      if (folderFilesMap.has(cleanName.toLowerCase())) {
        sourcePath = folderFilesMap.get(cleanName.toLowerCase());
      } else {
        const manualSelect = await open({
          title: `File not found in folder tree. Select file for: ${cleanName}`,
          multiple: false,
          filters: [{ name: 'Media files', extensions: ['mp4', 'png', 'jpg', 'jpeg', 'tiff', 'mp3', 'ogg'] }]
        });
        if (manualSelect) {
          sourcePath = Array.isArray(manualSelect) ? manualSelect[0] : manualSelect;
        }
      }

      let savedPath = null;
      if (sourcePath) {
        savedPath = await Backend.saveFile(sourcePath);
      }

      fileCache.set(cleanName.toLowerCase(), savedPath);
      return savedPath;
    }

    async function processFiles(value, isMultiple) {
      if (!value) return isMultiple ? [] : null;
      
      let filenames = [];
      if (Array.isArray(value)) {
        filenames = value.map(v => String(v).trim()).filter(Boolean);
      } else {
        filenames = isMultiple 
          ? String(value).split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
          : [String(value).trim()];
      }

      const savedPaths = [];
      for (const filename of filenames) {
        const saved = await resolveFile(filename);
        if (saved) {
          savedPaths.push(saved);
        }
      }

      return isMultiple ? savedPaths : (savedPaths[0] || null);
    }

    // 4. Process File Uploads for Global Config
    for (const [key, val] of Object.entries(configData)) {
      if (key.includes('file') && val) {
        const isMultiple = key.includes('files');
        configData[key] = await processFiles(val, isMultiple);
      }
    }

    // 5. Process File Uploads for Events Config
    for (const event of eventsData) {
      for (const [key, val] of Object.entries(event)) {
        if (key.includes('file') && val) {
          const isMultiple = key.includes('files');
          event[key] = await processFiles(val, isMultiple);
        }
      }
    }

    // 6. Merge and Save
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