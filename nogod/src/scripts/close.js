import { getCurrentWindow } from '@tauri-apps/api/window'

async function toggleFullscreen() {
  const appWindow = getCurrentWindow();
  const isFullscreen = await appWindow.isFullscreen();
  await appWindow.setFullscreen(!isFullscreen);
}

$(document).ready(() => {
  $('#close-button').click(() => getCurrentWindow().close())
  $('#fullscreen-button').click(() => toggleFullscreen())
})
