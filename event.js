const Event = (module => {
  module.html = (event, config) => {
    const dotHeight = event['dot height (px)'] / config['map height (px)'] * 100
    const aspectRatio = event['dot width (px)'] / event['dot height (px)']
    const dotWidth = dotHeight * aspectRatio

    return `
      <div referrerPolicy="no-referrer" style="
        position: absolute;
        left: calc(${event['dot position x (%)']}% - ${dotWidth / 2}px);
        top: calc(${event['dot position y (%)']}% - ${dotHeight / 2}px);
        height: ${dotHeight}%; aspect-ratio: ${aspectRatio};

        transition-property: background-position, background-size, top, left, aspect-ratio, height, border-radius, opacity;
        transition-timing-function: linear;
        transition-duration: ${config['animation fade duration (sec)'] || 1}s;
        transition-delay: ${config['animation delay (sec)'] || 0}s;
        
        border-radius: ${config['icons rounding (%)'] / 2}%;
        background-repeat: no-repeat;
        background-color: black;
        "
        title="${event['text story']}">
      </div>
    `
  }

  module.loadFiles = (event, config, loader, $main, $text, $subtext) => {
    event.$image = $main.find(`div[title="${event['text story']}"]`)
    event.images = []

    event['image files'].split('\n').filter(imageFile => imageFile.length > 0).forEach((imageFile, index) => {
      // if image file contains time, then it will be the delay before the next image
      if (imageFile.match(NUMBER_REGEX)) {
        imageFile = imageFile.replace(NUMBER_REGEX, '')
      }
      Backend.loadFile(imageFile, 'image').then(data => {
        event.images[index] = data
        if (index === 0) {
          event.$image.css({
            backgroundImage: `url(${data})`,
            backgroundSize: `${event['image width (px)'] / event['icon width (px)'] * 100}% ${event['image height (px)'] / event['icon height (px)'] * 100}%`,
            backgroundPosition: `left ${event['icon center x (%)'] - event['icon width (px)'] / event['image width (px)'] * 50}% top ${event['icon center y (%)'] - event['icon height (px)'] / event['image height (px)'] * 50}%`,
          })
        }
        loader.next()
      })
    })

    Backend.loadFile(event['audio file'], 'audio').then(data => {
      event['sound'] = data
      loader.next()
    })

    event.$image.on('click', e => {
      // select correct event using the target
      openImage(event, config, $main)
      setTimeout(() => {
        startAudio(event, config)
        runText(event, config, $main, $text, $subtext)
      }, (config['animation fade duration (sec)'] + config['animation move duration (sec)'] + config['animation open duration (sec)']) * 1000)
    })
  }

  const openImage = (event, config, $main) => {
    $main.children().filter((i, el) => el !== event.$image[0]).css({ opacity: 0 })
    setTimeout(() => {
      // move the image to the correct position
      const dotHeight = event['dot height (px)'] / config['map height (px)'] * 100, aspectRatio = event['dot width (px)'] / event['dot height (px)'], dotWidth = dotHeight * aspectRatio
      event.$image.css({ transitionDuration: `${config['animation move duration (sec)']}s` })
      event.$image.css({ left: `calc(${event['icon center x (%)']}% - ${dotHeight / 2}px)`, top: `calc(${event['icon center y (%)']}% - ${dotWidth / 2}px)` })

      setTimeout(() => {
        // open the image
        const mainWidth = $main.width(), mainHeight = $main.height()
        event.$image.css({ transitionDuration: `${config['animation open duration (sec)']}s` })
        event.$image.css({
          top: 0, left: 0,
          height: '100%', aspectRatio: String(mainWidth / mainHeight),
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
          borderRadius: 0
        })

        setTimeout(() => {
          startCarousel(event, config)
        }, config['animation open duration (sec)'] * 1000)
      }, config['animation move duration (sec)'] * 1000)
    }, config['animation fade duration (sec)'] * 1000)
  }

  const startCarousel = (event, config) => {
    let currentImage = 0
    const imageFiles = event['image files'].split('\n').filter(imageFile => imageFile.length > 0)
    if (imageFiles.length === 0) {
      return
    }
    const next = () => {
      if (currentImage >= event.images.length) {
        currentImage = 0
      }
      let delay = config['image time (sec)'] || 5
      if (imageFiles[currentImage].match(NUMBER_REGEX)) {
        delay = parseFloat(imageFiles[currentImage].match(NUMBER_REGEX)[1])
      }
      event.$image.css({ backgroundImage: `url(${event.images[currentImage++]})` })
      event.carouslTimeout = setTimeout(next, delay * 1000)
    }

    const firstImageTime = imageFiles[0].match(NUMBER_REGEX) ? parseFloat(imageFiles[0].match(NUMBER_REGEX)[1]) : (config['image time (sec)'] || 5)
    event.carouslTimeout = setTimeout(() => next(), firstImageTime * 1000)
  }

  const closeImage = (event, config, $main) => {
    const mapHeight = config['map height (px)']
    const dotPosX = event['dot position x (%)'], dotPosY = event['dot position y (%)']
    const iconCenterX = event['icon center x (px)'], iconCenterY = event['icon center y (px)'], iconWidth = event['icon width (px)'], iconHeight = event['icon height (px)'],
      dotHeight = event['dot height (px)'] / mapHeight * 100, aspectRatio = event['dot width (px)'] / event['dot height (px)'], dotWidth = dotHeight * aspectRatio,
      imageWidth = event['image width (px)'], imageHeight = event['image height (px)']

    // going back to the original size
    event.$image.css({ transitionDuration: `${config['animation open duration (sec)']}s` })
    event.$image.css({
      left: `calc(${event['icon center x (%)']}% - ${dotHeight / 2}px)`, top: `calc(${event['icon center y (%)']}% - ${dotWidth / 2}px)`,
      backgroundSize: `${event['image width (px)'] / event['icon width (px)'] * 100}% ${event['image height (px)'] / event['icon height (px)'] * 100}%`,
      backgroundPosition: `left ${event['icon center x (%)'] - event['icon width (px)'] / event['image width (px)'] * 50}% top ${event['icon center y (%)'] - event['icon height (px)'] / event['image height (px)'] * 50}%`,
      aspectRatio: String(aspectRatio), height: `${dotHeight}%`,
      borderRadius: config['icons rounding (%)'] / 2
    })

    clearTimeout(event.carouslTimeout)

    setTimeout(() => {
      // moving the image back to the original position
      event.$image.css({ transitionDuration: `${config['animation move duration (sec)']}s` })
      event.$image.css({
        left: `calc(${dotPosX}% - ${dotWidth / 2}px)`,
        top: `calc(${dotPosY}% - ${dotHeight / 2}px)`,
      })
    
      setTimeout(() => {
        // revealing the other points
        event.$image.css({ transitionDuration: `${config['animation fade duration (sec)']}s` })
        $main.children().css({ opacity: 1 })
      }, config['animation move duration (sec)'] * 1000)
    }, config['animation open duration (sec)'] * 1000)
  }

  const startAudio = (event, config) => {
    setTimeout(() =>{
      const audio = new Audio(event['sound'])
      audio.volume = (config['audio volume (%)'] || 100) / 100
      audio.play()
    })
  }

  const runText = (event, config, $main, $text, $subtext) => {
    const texts = event['text (split by newline)'].split('\n')
    $subtext.css({ fontFamily: event['subtext font'] || 'Arial' })
    $subtext[0].innerHTML = event['subtext']
    let currentText = 0
    const next = () => {
      if (currentText < texts.length) {
        let text = texts[currentText++]
        let delay = config['text time (sec)'] || 5
        if (text.match(NUMBER_REGEX)) {
          delay = parseFloat(text.match(NUMBER_REGEX)[1])
          text = text.replace(NUMBER_REGEX, '')
        }
        $text.css({ fontFamily: event['text font'] || 'Arial' })
        $text[0].innerHTML = text
        setTimeout(next, delay * 1000)
      } else {
        $text[0].innerHTML = ''
        closeImage(event, config, $main)
      }
    }

    setTimeout(() => next(), event['text delay (sec)'] * 1000)
    setTimeout(() => {
      $subtext.css({ opacity: 1 })
      setTimeout(() => {
        $subtext.css({ opacity: 0 })
      }, config['subtext duration (sec)'] * 1000)
    }, config['subtext delay (sec)'] * 1000)
  }

  return module

})({})
