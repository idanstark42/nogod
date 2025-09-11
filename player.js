class Player {
  constructor (raffle, config, $main, $text, $subtext) {
    this.config = config
    this.raffle = raffle
    this.$main = $main
    this.$text = $text
    this.$subtext = $subtext
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
      case 'video': await this._showVideo(this.startScreenFile); break;
      case 'image': await this._showImage(this.startScreenFile, this.config['start screen duration']); break;
    }

    await wait((this.config['time after start screen (sec)'] || 0) * 1000)

    this._playFirstEvent()
  }

  async showEndScreen () {
    console.debug('[player] showing end screen')
    switch (Backend.getFiletype(this.config['end screen file'])) {
      case 'video': await this._showVideo(this.endScreenFile); break;
      case 'image': await this._showImage(this.endScreenFile, this.config['end screen duration']); break;
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

  _showVideo (source) {
    console.debug('[player] showing video')
    $(this.$main).append(`<video id="video-screen" autoplay muted><source src="${source}" type="video/mp4"></video>`)
    return new Promise(resolve => {
      setTimeout(() => {
        $('#video-screen').on('ended', () => {
          $('#video-screen').remove()
          resolve()
        })
      }, 100)
    })
  }

  async _showImage (source, duration) {
    console.debug(`[player] showing image for ${duration} seconds`)

    $(this.$main).append(`<div id="image-screen" style="background-image: url(${source}); opacity: 0; transition: opacity ${this.config['screen fade time']}s linear"></div>`)
    await wait(this.config['animation fade duration (sec)'] * 1000)
    $('#main > :not(#image-screen)').css({ opacity: 0 })
    await wait(this.config['animation fade duration (sec)'] * 1000)
    $('#image-screen').css({ opacity: 1 })
    await wait((this.config['screen fade time'] + duration) * 1000)
    $('#image-screen').css({ opacity: 0 })
    await wait(this.config['animation fade duration (sec)'] * 1000)
    $('#main > :not(#image-screen)').css({ opacity: 1 })
    await wait(this.config['screen fade time'] * 1000)
    $('#image-screen').remove()
  }
}
