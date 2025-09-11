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
