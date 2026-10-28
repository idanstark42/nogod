class Player {
  constructor (raffle, config, $main, $text,$subtext) {
    this.config = config
    this.raffle = raffle
    this.$main =$main
    this.$text =$text
    this.$subtext =$subtext
    this.currentIndex = 0
    this.status = 'stopped'
    this.init()
  }

  get currentEvent () {
    return this.raffle.events[this.currentIndex]
  }

  init () {
    console.debug('[player] init')
    this.raffle.events.forEach(event => {
      event.onClose = () => {
        setTimeout(() => {
          if (this.status !== 'playing') {
            return
          }
          this.currentIndex++
          if (this.currentIndex >= this.raffle.events.length) {
            this.end()
          } else {
            this.currentEvent.start(this.$main, this.$text, this.$subtext)
          }
        }, (this.config['time between events (sec)'] || 0) * 1000)
      }
    })
  }

  start () {
    console.debug('[player] starting')
    if (this.status === 'playing') {
      return
    }
    this._start()
  }

  stop () {
    console.debug('[player] stopping')
    if (this.status === 'stopped') {
      return
    }

    this.status = 'stopped'
    this.currentEvent.stop(this.$main, this.$text, this.$subtext)
  }

  end () {
    console.debug('[player] end')
    if (this.endScreenFile) {
      this.showEndScreen()
    } else {
      this.restart()
    }
  }

  async showStartScreen () {
    console.debug('[player] showing start screen')
    switch (Backend.getFiletype(this.config['start screen file'])) {
      case 'video': await this._showVideo(this.startScreenFile, false, false); break;
      case 'image': await this._showImage(this.startScreenFile, this.config['start screen duration'], false, false); break;
    }

    await wait((this.config['time after start screen (sec)'] || 0) * 1000)

    this._playFirstEvent()
  }

  async showEndScreen () {
    console.debug('[player] showing end screen')
    switch (Backend.getFiletype(this.config['end screen file'])) {
      case 'video': await this._showVideo(this.endScreenFile, false, false); break;
      case 'image': await this._showImage(this.endScreenFile, this.config['end screen duration'], false, false); break;
    }
    
    this.restart()
  }

  restart () {
    console.debug('[player] restarting')
    this.raffle.shuffle()
    this._start()
  }

  _start () {
    this.currentIndex = 0
    this.status = 'playing'

    if (this.startScreenFile) {      
      this.showStartScreen()
    } else {
      this._playFirstEvent()
    }
  }

  _playFirstEvent () {
    this.currentEvent.start(this.$main, this.$text, this.$subtext)
  }

  _showVideo (source, animateIn = true, animateOut = true) {
    console.debug('[player] showing video')
    // If animateIn is false, we can skip any fade-in prep if needed
    $(this.$main).append(`<video id="video-screen" autoplay muted><source src="${source}" type="video/mp4"></video>`)
    return new Promise(resolve => {
      setTimeout(() => {
        $('#video-screen').on('ended', () => {
          // If animateOut is false, we instantly remove without fading out
          $('#video-screen').remove()
          resolve()
        })
      }, 100)
    })
  }

  async _showImage (source, duration, animateIn = true, animateOut = true) {
    console.debug(`[player] showing image for ${duration} seconds (animateIn: ${animateIn}, animateOut: ${animateOut})`)

    // 1. Animate in if animateIn is on
    if (animateIn) {
      $(this.$main).append(`<div id="image-screen" style="background-image: url(${source}); opacity: 0; transition: opacity ${this.config['screen fade time (sec)']}s linear"></div>`)
      await wait(this.config['animation fade duration (sec)'] * 1000)
      $('#main > :not(#image-screen)').css({ opacity: 0 })
      await wait(this.config['animation fade duration (sec)'] * 1000)
      $('#image-screen').css({ opacity: 1 })
      await wait(this.config['screen fade time (sec)'] * 1000)
    } else {
      // Instant display on a solid black background
      $(this.$main).append(`<div id="image-screen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000 url(${source}) center/contain no-repeat; opacity: 1; z-index: 10;"></div>`)
      $('#main > :not(#image-screen)').css({ opacity: 0 })
    }

    // 2. Show the image for the right amount of time
    await wait(duration * 1000)

    // 3. Animate out if animateOut is on
    if (animateOut) {
      $('#image-screen').css({ opacity: 0 })
      await wait(this.config['animation fade duration (sec)'] * 1000)
      $('#main > :not(#image-screen)').css({ opacity: 1 })
      await wait(this.config['screen fade time (sec)'] * 1000)
      $('#image-screen').remove()
    } else {
      $('#main > :not(#image-screen)').css({ opacity: 1 })
      $('#image-screen').remove()
    }
  }
}

window.Player = Player