class Event {
  constructor (raw, config) {
    Object.assign(this, raw)
    this.config = config

    this.parseText()
    console.debug(`[event] created ${this['text number']} (${this.constructor.name})`)
  }

  parseText () {
    const textLines = this['text (split by newline)']
      .split('\n')
      .map(textLine => textLine.trim())
    this.textLines = textLines.map(textLine => textLine.match(NUMBER_REGEX) ? textLine.replace(NUMBER_REGEX, '') : textLine)
    this.textTimes = textLines.map(textLine => textLine.match(NUMBER_REGEX) ? parseFloat(textLine.match(NUMBER_REGEX)[1]) : (this.config['text time (sec)'] || 5))
    this.totalTime = this.textTimes.reduce((acc, time) => acc + time, 0)
  }

  html () {
    const dot = this.dotDimensions
    return `
      <div referrerPolicy="no-referrer" style="
        position: absolute;
        display: block;
        left: round(calc(${this['dot position x (%)']}% - ${dot.width / 2}%), 1px);
        top: round(calc(${this['dot position y (%)']}% - ${dot.height / 2}%), 1px);
        height: round(${dot.height}%, 1px);
        width: round(${dot.width}%, 1px);

        transition-property: background-position, background-size, top, left, height, width, border-radius, opacity;
        transition-timing-function: linear;
        transition-duration: ${this.config['animation fade duration (sec)'] || 1}s;
        transition-delay: ${this.config['animation delay (sec)'] || 0}s;
        
        border-radius: ${this.config['icons rounding (%)'] / 2}%;
        background-repeat: no-repeat;
        background-color: ${this['dot color']};
        overflow: hidden;
        will-change: transform, opacity;
        "
        title="${this['text story']}">
      </div>
    `
  }

  get filesCount () {
    return 1
  }

  get dotDimensions () {
    const dotHeight = this['dot height (px)'] / this.config['map height (px)'] * 100
    const dotWidth = this['dot width (px)'] / (this.config['map height (px)'] * this.config['map aspect ratio']) * 100
    return { width: dotWidth, height: dotHeight }
  }

  loadFiles (loader, $main) {
    this.$element = $main.find(`div[title="${this['text story']}"]`)

    Backend.loadFile(this['audio file'], 'audio').then(data => {
      this['sound'] = data
      loader.next()
    })
  }

  attachEvents ($main, $text, $subtext) {
    this.$element.on('click', () => this.start($main, $text, $subtext))
  }

  start ($main, $text, $subtext) {
    console.debug(`[event] starting ${this['text number']} (${this.constructor.name})`)
    this.open($main)
    setTimeout(() => {
      this.startAudio()
      this.runText($main, $text, $subtext)
    }, (this.config['animation fade duration (sec)'] + this.config['animation move duration (sec)'] + this.config['animation open duration (sec)']) * 1000)
  }

  stop ($main, $text, $subtext) {
    console.debug(`[event] stopping ${this['text number']} (${this.constructor.name})`)
    this.close($main)
    this.endAudio()
    this.textIterationManager.stop = true
    this.textIterationManager = null
    $text[0].innerHTML = ''
    $subtext[0].innerHTML = ''
    $subtext.css({ opacity: 0 })
  }

  open ($main) {
    console.debug('[event] hiding other points')
    $main.children().filter((i, el) => el !== this.$element[0]).css({ opacity: 0 })

    const moveToPosition = [() => {
      const dot = this.dotDimensions

      // move the element to the correct position
      console.debug('[event] moving to the correct position')
      this.$element.css({ transitionDuration: `${this.config['animation move duration (sec)']}s` })
      this.$element.css({ left: `calc(${this['icon center x (%)']}% - ${dot.height / 2}px)`, top: `calc(${this['icon center y (%)']}% - ${dot.width / 2}px)` })
    }, this.config['animation fade duration (sec)'] * 1000]

    execute([
      this.config['move points'] ? moveToPosition : null,
      [() => {
        console.debug('[event] opening the image')
        this.$element.css({ transitionDuration: `${this.config['animation open duration (sec)']}s` })
        this.$element.css({
          top: 0, left: 0,
          height: '100%', width: '100%',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
          borderRadius: 0
        })
      }, this.config['animation move duration (sec)'] * 1000], [() => {
        this.run()
      }, this.config['animation open duration (sec)'] * 1000]
    ].filter(Boolean))
  }

  close ($main) {
    console.debug('[event] closing the image')
    const dotPosX = this['dot position x (%)'], dotPosY = this['dot position y (%)']
    const dot = this.dotDimensions

    // going back to the original size
    this.$element.css({ transitionDuration: `${this.config['animation open duration (sec)']}s` })
    this.$element.css({
      left: `calc(${this['icon center x (%)']}% - ${dot.height / 2}px)`, top: `calc(${this['icon center y (%)']}% - ${dot.width / 2}px)`,
      backgroundSize: `${this['image width (px)'] / this['icon width (px)'] * 100}% ${this['image height (px)'] / this['icon height (px)'] * 100}%`,
      backgroundPosition: `left ${this['icon center x (%)'] - this['icon width (px)'] / this['image width (px)'] * 50}% top ${this['icon center y (%)'] - this['icon height (px)'] / this['image height (px)'] * 50}%`,
      height: `${dot.height}%`, width: `${dot.width}%`,
      borderRadius: this.config['icons rounding (%)'] / 2
    })

    this.endAudio()

    const moveToPosition = [() => {
      console.debug('[event] moving back to the original position')
      this.$element.css({ transitionDuration: `${this.config['animation move duration (sec)']}s` })
      this.$element.css({
        left: `calc(${dotPosX}% - ${dot.width / 2}px)`,
        top: `calc(${dotPosY}% - ${dot.height / 2}px)`,
      })
    }, this.config['animation open duration (sec)'] * 1000]

    execute([
      this.config['move points'] ? moveToPosition : null,
      [() => {
        console.debug('[event] revealing other points')
        this.$element.css({ transitionDuration: `${this.config['animation fade duration (sec)']}s` })
        $main.children().css({ opacity: 1 })
      }, this.config['animation move duration (sec)'] * 1000],
      [() => {
        if (this.hasOwnProperty('onClose') && typeof this.onClose === 'function') {
          this.onClose()
        }
      }, this.config['animation fade duration (sec)'] * 1000]
    ].filter(Boolean))
  }

  startAudio () {
    setTimeout(() => {
      console.debug('[event] playing audio')
      const audio = new Audio(this.sound)
      audio.volume = (this.config['audio volume (%)'] || 100) / 100
      audio.play()
      this.audio = audio
    })
  }

  endAudio () {
    console.debug('[event] stopping audio')
    this.audio.pause()
    this.audio.currentTime = 0
  }

  runText ($main, $text, $subtext) {
    console.debug('[event] running text')
    $subtext.css({ fontFamily: this['subtext font'] || 'Arial' })
    $subtext[0].innerHTML = this['subtext']

    this.textIterationManager = iterate(['', ...this.textLines], textLine => {
      $text.css({ fontFamily: this['text font'] || 'Arial' })
      $text[0].innerHTML = textLine
      console.debug(`[event] ${textLine}`)
    }, [this['text delay (sec)'], ...this.textTimes])

    this.textIterationManager.onDone = () => {
      $text[0].innerHTML = ''
      this.close($main)
    }

    execute([
      [() => {
        console.debug('[event] revealing subtext')
        $subtext.css({ opacity: 1 })
      }, this.config['subtext delay (sec)'] * 1000],
      [() => {
        console.debug('[event] hiding subtext')
        $subtext.css({ opacity: 0 })
      }, this.config['subtext duration (sec)'] * 1000]
    ])
  }

  static build (raw, config) {
    return FACTORY[raw.displayType](raw, config)
  }

  static get ID_FIELD () {
    return 'text number'
  }
}

const FACTORY = {
  private: (raw, config) => new ImagesEvent(raw, config, raw['image files'] || ''),
  'raffle image': (raw, config) => new ImagesEvent(raw, config, raw.file),
  'raffle video': (raw, config) => new VideoEvent(raw, config),
}

class ImagesEvent extends Event {
  constructor (raw, config, images) {
    super(raw, config)
    this.parseImages(images)
  }

  parseImages (images) {
    const imageLines = images
      .split('\n')
      .filter(imageFile => imageFile.length > 0)
      .map(imageFile => imageFile.trim()) 
    this.imageFiles = imageLines.map(imageLine => imageLine.match(NUMBER_REGEX) ? imageLine.replace(NUMBER_REGEX, '') : imageLine)
    this.imageTimes = imageLines.map(imageLine => imageLine.match(NUMBER_REGEX) ? parseFloat(imageLine.match(NUMBER_REGEX)[1]) : (this.config['image time (sec)'] || 5))
  }

  get filesCount () {
    return this.imageFiles.length + 1
  }

  loadFiles (loader, $main) {
    super.loadFiles(loader, $main)
    this.images = []

    this.imageFiles.forEach((imageFile, index) => {
      Backend.loadFile(imageFile, 'image').then(data => {
        this.images[index] = data
        if (index === 0 && this['dot color'].trim() === '') {
          this.$element.css({
            backgroundImage: `url(${data})`,
            backgroundSize: `${this['image width (px)'] / this['icon width (px)'] * 100}% ${this['image height (px)'] / this['icon height (px)'] * 100}%`,
            backgroundPosition: `left ${this['icon center x (%)'] - this['icon width (px)'] / this['image width (px)'] * 50}% top ${this['icon center y (%)'] - this['icon height (px)'] / this['image height (px)'] * 50}%`,
          })
        }
        loader.next()
      })
    })
  }

  close ($main) {
    if (this.carouselTimeoutHolder) {
      console.debug('[event] stopping image carousel')
      clearTimeout(this.carouselTimeoutHolder.timeout)
      this.carouselTimeoutHolder = null
    }
    if (this['dot color'].trim() !== '') {
      this.$element.css({ backgroundImage: '' })
    }
    super.close($main)
  }

  run () {
    if (this.imageFiles.length === 0) {
      return
    }

    console.debug('[event] starting image carousel')
    this.carouselTimeoutHolder = iterate(this.images, image => {
      this.$element.css({ backgroundImage: `url(${image})` })
    }, this.imageTimes, true)
  }
}

class VideoEvent extends Event {
  constructor (raw, config) {
    super(raw, config)
    this.parseVideo()
  }

  parseVideo () {
    this.videoFile = this.file
  }

  get filesCount () {
    return super.filesCount + 1
  }

  loadFiles (loader, $main) {
    super.loadFiles(loader, $main)
    Backend.loadFile(this.videoFile, 'video').then(data => {
      this.$element[0].innerHTML = `
        <video muted playsinline style="
          width: 100%; height: 100%;
          top: 0; left: 0;
          position: absolute;
          background-color: black;
          border-radius: 0;
          ${this['dot color'].trim() !== '' ? 'display: none;' : ''}
        ">
          <source src="${data}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `
      setTimeout(() => {
        this.$element.children('video')[0].addEventListener('loadedmetadata', () => {
          this.originalVideoDuration = this.$element.children('video')[0].duration
          this.speed = this.originalVideoDuration / this.totalTime
          this.$element.children('video')[0].playbackRate = this.speed
        })
      })
      loader.next()
    })
  }

  run () {
    if (this.videoFile.length === 0) {
      return
    }
    this.$element.children('video').css({ display: 'block' })
    setTimeout(() => {
      console.debug('[event] starting video')
      this.$element.children('video')[0].play()
    }, this['text delay (sec)'] * 1000)
  }

  close ($main) {
    super.close($main)
    this.$element.children('video').css({ display: 'none' })
  }
}

const iterate = (arr, func, times, repeat=false, index=0, iterationManager={ stop: false }) => {
  if (iterationManager.stop) {
    return
  }
  
  if (index >= arr.length) {
    if (repeat) {
      index = 0
    } else {
      if (iterationManager.onDone) {
        iterationManager.onDone()
      }
      return
    }
  }

  func(arr[index])
  iterationManager.timeout = setTimeout(() => iterate(arr, func, times, repeat, index + 1, iterationManager), times[index] * 1000)
  return iterationManager
}

const execute = (actions) => {
  const doblet = actions.shift()
  if (!doblet) {
    return
  }
  const [action, time] = doblet
  setTimeout(() => {
    action()
    execute(actions)
  }, time)
}
