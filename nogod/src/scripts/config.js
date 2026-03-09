const Config = (module => {

  module.init = () => {
    $('.edit')[0].innerHTML = fields.map(([field, type]) => input(field, type, 0)).join('')
  }

  function input(name, type, value) {
    return `<div class="input">
      <label>${name}</label>
      <input type="${type}" name="${name}" ${type === "checkbox" ? `checked="${Boolean(value)}"` : `value="${value ?? ""}"`}>
    </div>`
  }

  const fields = [
    ["map aspect ratio", "number"],
    ["map height (px)", "number"],
    ["animation fade duration (sec)", "number"],
    ["animation move duration (sec)", "number"],
    ["animation open duration (sec)", "number"],
    ["animation delay (sec)", "number"],
    ["audio volume (%)", "number"],
    ["image area height (%)", "number"],
    ["image area position (%)", "number"],
    ["text position (%)", "number"],
    ["subtext position (%)", "number"],
    ["text time (sec)", "number"],
    ["image time (sec)", "number"],
    ["text area background color", "color"],
    ["main background color", "color"],
    ["deadzone background color", "color"],
    ["text color", "color"],
    ["text size (px)", "number"],
    ["subtext size (px)", "number"],
    ["icons rounding (%)", "number"],
    ["show dots", "checkbox"],
    ["dots count", "number"],
    ["dots speed", "number"],
    ["dots size", "number"],
    ["dots color", "color"]
  ]

  module.template = `<div class="edit">
  </div>`

  return module

})({})

window.Config = Config
