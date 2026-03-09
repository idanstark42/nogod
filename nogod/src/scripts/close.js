import { getCurrentWindow } from '@tauri-apps/api/window'

$(document).ready(() => {
  $('#close-button').click(() => getCurrentWindow().close())
})