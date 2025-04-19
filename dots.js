
const Dots = (module => {
  class Dot {
    constructor (x, y, speedX, speedY, $element) {
      this.x = x
      this.y = y
      this.speedX = speedX
      this.speedY = speedY
      this.$element = $element
    }
  
    move () {
      this.x += this.speedX
      this.y += this.speedY
      if (this.x < 0 || this.x > 100) {
        this.speedX *= -1
      }
      if (this.y < 0 || this.y > 100) {
        this.speedY *= -1
      }
      this.$element.css({ left: `${this.x}%`, top: `${this.y}%` })
    }
  }

  module.init = ($main, config) => {
    console.debug('[dots] init')
    const numberOfDots = config['dots count']
    const dotSize = config['dots size']
    const dotSpeed = config['dots speed']
  
    const dots = Array.from({ length: numberOfDots }, (_, i) => {
      const $dot = $(`<div style="
        position: absolute;
        width: ${dotSize}px;
        height: ${dotSize}px;
        background-color: ${config['dots color']};
        border-radius: 50%;
      "></div>`)
      $main.append($dot)
      const speedDirection = Math.random() * 360
      return new Dot(Math.random() * 100, Math.random() * 100, Math.cos(speedDirection) * dotSpeed / 100, Math.sin(speedDirection) * dotSpeed / 100, $dot)
    })
    console.debug('[dots] starting motion')
    setInterval(() => {
      for (let dot of dots) {
        dot.move()
      }
    }, 1000 / dotSpeed)
  } 

  return module

}) ({})