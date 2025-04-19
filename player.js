class Player {
  constructor (raffle, config, $main, $text, $subtext) {
    this.config = config
    this.raffle = raffle
    this.currentIndex = 0
    this.status = 'stopped'
    this.init($main, $text, $subtext)
  }

  get currentEvent () {
    return this.raffle.events[this.currentIndex]
  }

  init ($main, $text, $subtext) {
    console.debug('[player] init')
    this.raffle.events.forEach(event => {
      event.onClose = () => {
        setTimeout(() => {
          if (this.status !== 'playing') {
            return
          }
          this.currentIndex++
          if (this.currentIndex >= this.raffle.events.length) {
            this.currentIndex = 0
          }
          this.currentEvent.start($main, $text, $subtext)
        }, (this.config['time between events (sec)'] || 0) * 1000)
      }
    })
  }

  start ($main, $text, $subtext) {
    console.debug('[player] starting')
    if (this.status === 'playing') {
      return
    }
    
    this.currentIndex = 0
    this.currentEvent.start($main, $text, $subtext)

    this.status = 'playing'
  }

  stop ($main, $text, $subtext) {
    console.debug('[player] stopping')
    if (this.status === 'stopped') {
      return
    }
    this.status = 'stopped'
    this.currentEvent.stop($main, $text, $subtext)
  }

  toggle ($main, $text, $subtext) {
    if (this.status === 'playing') {
      this.stop($main, $text, $subtext)
    } else {
      this.start($main, $text, $subtext)
    }
  }
}