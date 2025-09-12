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
        left: round(calc(${this['dot position x (%)'] - dot.width / 2}%), 1px);
        top: round(calc(${this['dot position y (%)'] - dot.height / 2}%), 1px);
        width: round(${dot.width}%, 1px);
        aspect-ratio: ${this['dot height (px)'] / this['dot width (px)']};

        transition-property: background-position, background-size, top, left, height, width, border-radius, opacity;
        transition-timing-function: linear;
        transition-duration: ${this.config['animation fade duration (sec)'] || 1}s;
        
        border-radius: ${this.config['icons rounding (%)'] / 2}%;
        background-repeat: no-repeat;
        background-color: ${this['dot color']};
        overflow: hidden;
        will-change: transform, opacity;
        transform: translate(-50%, -50%);
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

  get dotPosition () {
    const dotPosX = this['dot position x (%)'], dotPosY = this['dot position y (%)']
    const dot = this.dotDimensions

    return {
      left: `round(calc(${dotPosX}% - ${dot.width / 2}px), 1px)`,
      top: `round(calc(${dotPosY}% - ${dot.height / 2}px), 1px)`,
    }
  }

  get iconPosition () {
    const dot = this.dotDimensions

    return {
      left: `round(calc(${this['icon center x (%)']}% - ${dot.height / 2}px), 1px)`,
      top: `round(calc(${this['icon center y (%)']}% - ${dot.width / 2}px), 1px)`
    }
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
    }, (this.config['animation fade duration (sec)'] +
      this.config['animation move duration (sec)'] +
      this.config['animation open duration (sec)'] +
      this.config['wait after points fade (sec)'] +
      this.config['wait after point move (sec)'] +
      this.config['wait after opening (sec)']
    ) * 1000)
  }

  stop ($main, $text, $subtext) {
    console.debug(`[event] stopping ${this['text number']} (${this.constructor.name})`)
    this.close($main)
    this.endAudio()
    if (this.textIterationManager) {
      this.textIterationManager.stop = true
      this.textIterationManager = null
    }
    $text[0].innerHTML = ''
    $subtext[0].innerHTML = ''
    $subtext.css({ opacity: 0 })
  }

  async open ($main) {
    await this.step('hiding other points', () => {
      this.toggleOtherPoints(false, $main)
    }, (this.config['animation fade duration (sec)'] + this.config['wait after points fade (sec)']) * 1000)

    if (this.config['move points']) {
      await this.step('moving to the correct position', () => {
        this.movePointTo(this.iconPosition)
      }, (this.config['animation move duration (sec)'] + this.config['wait after point move (sec)']) * 1000)
    }

    await this.step('opening up', () => this.openUp(), this.config['animation open duration (sec)'] * 1000)

    this.reshapeToSquare()
    await wait(this.config['wait after opening (sec)'] * 1000)
    this.run()
  }

  async close ($main) {
    await wait(this.config['wait before closing (sec)'] * 1000)
    this.reshapeToCircle()
    
    await until(() => this.isCircle())
    this.endAudio()
    
    await this.step('closing down', () => this.closeDown(), (this.config['animation open duration (sec)'] + this.config['wait after closing (sec)']) * 1000)

    if (this.config['move points']) {
      await this.step('moving back to the original position', () => this.movePointTo(this.dotPosition), (this.config['animation move duration (sec)'] + this.config['wait after point move back (sec)']) * 1000)
    }

    await this.step('revealing other points', () => this.toggleOtherPoints(true, $main), this.config['animation fade duration (sec)'] * 1000)
    this.$element.css({ transitionDuration: `${this.config['animation open duration (sec)']}s` })

    if (this.hasOwnProperty('onClose') && typeof this.onClose === 'function') {
      this.onClose()
    }
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
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
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

    (async () => {
      await wait(this.config['subtext delay (sec)'] * 1000)
      console.debug('[event] revealing subtext')
      $subtext.css({ opacity: 1 })
      
      await wait(this.config['subtext duration (sec)'] * 1000)
      console.debug('[event] hiding subtext')
      $subtext.css({ opacity: 0 })
    }) ()
  }

  async step (title, execute, duration) {
    console.debug(`[event] ${title}`)
    execute()
    await wait(duration) 
  }

  toggleOtherPoints (visible, $main) {
    $main.children().filter((i, el) => el !== this.$element[0]).css({ opacity: visible ? 1 : 0 })
  }

  movePointTo (position) {
    this.$element.css({ transitionDuration: `${this.config['animation move duration (sec)']}s` })
    this.$element.css(position)
  }

  openUp () {
    this.$element.css({ transitionDuration: `${this.config['animation open duration (sec)']}s` })
    this.$element.css({
      width: '290%',
      backgroundPosition: 'center',
      backgroundSize: '100% 100%',
    })
  }

  closeDown () {
    const dot = this.dotDimensions
    this.$element.css({ transitionDuration: `${this.config['animation open duration (sec)']}s` })
    this.$element.css({
      backgroundSize: `${this['image width (px)'] / this['icon width (px)'] * 100}% ${this['image height (px)'] / this['icon height (px)'] * 100}%`,
      backgroundPosition: `left ${this['icon center x (%)'] - this['icon width (px)'] / this['image width (px)'] * 50}% top ${this['icon center y (%)'] - this['icon height (px)'] / this['image height (px)'] * 50}%`,
      width: `${dot.width}%`
    })
  }

  reshapeToSquare () {
    this.$element.css({ transitionDuration: '0s' })
    this.$element.css({
      width: '100%', height: '100%', aspectRatio: 'unset',
      top: 0, left: 0,
      borderRadius: 0,
      transform: 'none'
    })
  }

  reshapeToCircle () {
    this.$element.css({ transitionDuration: '0s' })
    this.$element.css({
      width: '290%', height: 'unset', aspectRatio: `${this['dot height (px)'] / this['dot width (px)']}`,
      ...(this.config['move points'] ? this.iconPosition : this.dotPosition),
      borderRadius: `${this.config['icons rounding (%)'] / 2}%`,
      transform: 'translate(-50%, -50%)'
    })
  }

  isCircle () {
    return Number(this.$element.css('border-radius').replace('%', '')) > 0
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
