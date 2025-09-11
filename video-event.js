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
