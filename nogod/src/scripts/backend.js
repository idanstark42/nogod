import { mkdir, readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { appDataDir, join } from "@tauri-apps/api/path"
import { convertFileSrc } from "@tauri-apps/api/core"

const Backend = (module => {

  /* ---------------- CONSTANTS ---------------- */

  const CONFIG_DIR = "configs"

  const MEDIA_FOLDERS = {
    image: "images",
    video: "videos",
    audio: "audio"
  }

  module.FILETYPES = {
    mp4: "video",
    png: "image",
    jpg: "image",
    jpeg: "image",
    tiff: "image",
    mp3: "audio",
    ogg: "audio"
  }

  /* ---------------- INITIALIZATION ---------------- */

  module.init = async () => {
    const base = await appDataDir()

    await mkdir(await join(base, CONFIG_DIR), { recursive: true })
    await mkdir(await join(base, MEDIA_FOLDERS.image), { recursive: true })
    await mkdir(await join(base, MEDIA_FOLDERS.video), { recursive: true })
    await mkdir(await join(base, MEDIA_FOLDERS.audio), { recursive: true })
  }

  /* ---------------- UTILITIES ---------------- */

  module.getFiletype = filename =>
    module.FILETYPES[filename.split('.').pop().toLowerCase()]

  /* ---------------- CONFIG MANAGEMENT ---------------- */

  module.listConfigs = async () => {
    const dir = await join(await appDataDir(), CONFIG_DIR)
    const entries = await readDir(dir)
    const filtered = entries
      .filter(e => e.name.endsWith(".json"))
      .map(e => e.name.replace(".json", ""))
    
    console.debug("available configurations:")
    for(const entry of filtered) {
      console.debug(entry)
    }

    return filtered
  }

  module.loadConfig = async (name) => {
    const file = await join(await appDataDir(), CONFIG_DIR, `${name}.json`)
    const text = await readTextFile(file)
    return JSON.parse(text)
  }

  module.saveConfig = async (name, config) => {
    const file = await join(await appDataDir(), CONFIG_DIR, `${name}.json`)
    await writeTextFile(file, JSON.stringify(config, null, 2))
    return true
  }

  module.createConfig = async (name, config = {}) => {
    const file = await join(await appDataDir(), CONFIG_DIR, `${name}.json`)
    await writeTextFile(file, JSON.stringify(config, null, 2))
    return true
  }

  /* ---------------- MEDIA FILES ---------------- */

  module.loadFile = async (filename, filetype) => {
    if (!filetype)
      filetype = module.getFiletype(filename)

    const folder = MEDIA_FOLDERS[filetype]
    const file = await join(await appDataDir(), folder, filename)
    return convertFileSrc(file)
  }

  return module

})({})

window.Backend = Backend
