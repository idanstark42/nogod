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
            this.currentIndex = 0
          }
          this.currentEvent.start(this.$main, this.$text, this.$subtext)
        }, (this.config['time between events (sec)'] || 0) * 1000)
      }
    })
  }

  start () {
    console.debug('[player] starting')
    if (this.status === 'playing') {
      return
    }
    
    this.currentIndex = 0
    this.currentEvent.start(this.$main, this.$text, this.$subtext)

    this.status = 'playing'
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
}