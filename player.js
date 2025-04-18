class Player {
  constructor (raffle, events, config) {
    this.events = events
    this.config = config
    this.raffle = raffle
    this.currentIndex = 0
    this.status = 'stopped'
    this.init()
  }

  get currentEvent () {
    return this.events[this.currentIndex]
  }

  init ($main, $text, $subtext) {
    this.events.forEach(event => {
      event.onClose = () => {
        if (this.status !== 'playing') {
          return
        }
        this.currentIndex++
        if (this.currentIndex >= this.events.length) {
          this.currentIndex = 0
        }
        this.currentEvent.open($main, $text, $subtext)
      }
    })
  }

  start ($main, $text, $subtext) {
    if (this.status === 'playing') {
      return
    }
    
    this.currentIndex = 0
    this.currentEvent.start($main, $text, $subtext)

    this.status = 'playing'
  }

  stop ($main, $text, $subtext) {
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