class Loader {
  constructor (total, print, done) {
    this.total = total
    this.loaded = 0
    this.print = print
    this.done = done
    this.render()
  }

  next () {
    this.loaded++
    this.render()
    if (this.loaded === this.total) {
      console.debug('[loader] done')
      this.done()
    }
  }

  render () {
    this.print(`Still loading... Please wait.<br/>${this.loaded}/${this.total}`)
    console.debug(`[loader] ${this.loaded}/${this.total}`)
  }
}