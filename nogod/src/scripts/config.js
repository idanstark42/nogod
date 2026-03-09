const Config = (module => {

  module.init = () => {
    console.log("init config")
  }

  module.template = ``

  return module

})({})

window.Config = Config
