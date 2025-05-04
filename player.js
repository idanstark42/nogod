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

  toggle () {
    if (this.status === 'playing') {
      this.stop()
    } else {
      this.start()
    }
  }

  end () {
    console.debug('[player] end')
    if (this.config['end screen file'].trim() !== '') {
      this.showEndScreen()
      setTimeout(() => this.restart(), this.config['end screen time (sec)'] * 1000)
    } else {
      this.restart()
    }
  }

  showEndScreen () {
    // add the end screen element to the $main element
    $(this.$main).append('<video id="end-screen" autoplay muted loop><source src="' + this.config['end screen file'] + '" type="video/mp4"></video>')
    // remove the end screen element after the video ends
    $('#end-screen').on('ended', () => {
      $('#end-screen').remove()
    })
    // remove the end screen element after the end screen time
    setTimeout(() => {
      $('#end-screen').remove()
    }, this.config['end screen time (sec)'] * 1000)
  }

  showOpenScreen () {
    // add the openning screen element to the $main element
    $(this.$main).append('<video id="open-screen" autoplay muted loop><source src="' + this.config['open screen file'] + '" type="video/mp4"></video>')
    // remove the openning screen element after the video ends
    $('#open-screen').on('ended', () => {
      $('#open-screen').remove()
    })
    // remove the openning screen element after the open screen time
    setTimeout(() => {
      $('#open-screen').remove()
    }, this.config['open screen time (sec)'] * 1000)
  }

  restart () {
    console.debug('[player] restarting')
    this.raffle.shuffle()
    this._start()
  }

  _start () {
    this.currentIndex = 0

    const playFirstEvent = () => {
      this.currentEvent.start(this.$main, this.$text, this.$subtext)
      this.status = 'playing'
    }

    if (this.config['open screen file'].trim() !== '') {      
      showOpenScreen()
      setTimeout(playFirstEvent, this.config['open screen time (sec)'] * 1000)
    } else {
      playFirstEvent()
    }
  }
}