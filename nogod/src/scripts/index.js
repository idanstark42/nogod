const Index = (module => {

  async function loadConfigs() {
    await Backend.init()
    const listDiv = document.getElementById("config-list")
    listDiv.innerHTML = ""

    const configs = await Backend.listConfigs()

    if (configs.length === 0) {
      listDiv.innerHTML = `<div class="no-config">No versions available yet. Create a new one.</div>`
    } else {
      listDiv.innerHTML = configs.map(config => `<div class="config segment" version="${config}">
        <div class="name">${config}</div>
        <div class="run">run</div>
        <div class="edit">edit</div>
      </div>`).join('')
    }
  }

  async function createNew() {
    const name = prompt("Enter new config name:")
    if (!name) return
    await Backend.createConfig(name)
    await loadConfigs()
  }

  async function run (event) {
    
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
    $('.config .run').click(run)
    $('.config .edit').click(edit)
  }

  module.template = `<h1>Available Versions</h1>
    <div id="config-list"></div>
    <button id="create-new">Create New Version</button>`

  return module

})({})

window.Index = Index
