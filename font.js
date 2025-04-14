const Font = (module => {

  module._fonts = []
  
  module.importFromGoogle = fontName => {
    if (module._fonts.includes(fontName)) {
      return
    }
    module._fonts.push(fontName)
  
    const formattedFontName = fontName.replace(/\s+/g, '+');
    const importRule = `@import url('https://fonts.googleapis.com/css2?family=${formattedFontName}&display=swap');`;
    const $styleTag = $('<style>').text(importRule);
    $('head').append($styleTag);
    $('body').css('font-family', `'${fontName}', sans-serif`);
  }

  return module

})({})