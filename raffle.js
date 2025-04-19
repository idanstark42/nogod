class Raffle {
  constructor(events, config) {
    this.config = config
    this.init(events)
  }

  init (events) {
    console.debug('[raffle] init')
    this.files = this.config['raffle files' || ''].split('\n').filter(file => file.length > 0).map(file => file.trim())
    const possibleVideoEvents = events.filter(event => event['can get video'])
    if (possibleVideoEvents.length > this.files.length) {
      throw new Error('Not enough files')
    }

    const numberOfVideos = this.randomNumberOfVideos(Math.min(possibleVideoEvents.length, this.files.length))
    console.debug(`using ${numberOfVideos} videos`)
    const videoIndices = this.randomVideoIndices(events, numberOfVideos)
    const videoEvents = this.getVideoEvents(possibleVideoEvents, videoIndices.length)
    this.markEvents(events, videoEvents, possibleVideoEvents)
    this.assignFiles(possibleVideoEvents, videoIndices)
    this.events = this.generateEvents(events, videoEvents, videoIndices)
    console.debug('[raffle] finished')
    this.events.forEach(event => {
      console.debug(`[raffle] event ${event[Event.ID_FIELD]} (${event.displayType}${event.file ? `:${event.file}` : ''})`)
    })
  }

  enrich (events) {
    this.events = this.events.map(raw => events.find(event => event[Event.ID_FIELD] === raw[Event.ID_FIELD]))
  }

  randomNumberOfVideos (minimumVideos) {
    this.minVideos = Math.min(this.config['min videos'] || 0, minimumVideos)
    this.maxVideos = this.config['max videos'] || 0
    return random(this.minVideos, this.maxVideos)
  }

  randomVideoIndices (events, numberOfVideos) {
    if (numberOfVideos === 0) {
      return []
    }

    this.minDistanceBetweenVideos = this.config['min distance between videos'] || 0
    const maximumShift = events.length - ((numberOfVideos - 1) * this.minDistanceBetweenVideos + 1)
    if (maximumShift < 0) {
      throw new Error('Not enough space for videos')
    }
    let shift = 0
    const videoIndices = new Array(numberOfVideos).fill(0).map((_, i) => i * this.minDistanceBetweenVideos)
      .map((index) => {
        shift += random(0, maximumShift - shift)
        return index + shift
      })
    return videoIndices
  }

  getVideoEvents (events, videoIndices) {
    if (videoIndices === 0) {
      return []
    }
    return new Array(videoIndices).fill(0).map(() => sample(events, false))
  }

  markEvents (events, videoEvents, possibleVideoEvents) {
    events.forEach(event => { event.displayType = 'private' })
    possibleVideoEvents.forEach(event => { event.displayType = 'raffle image' })
    videoEvents.forEach(event => { event.displayType = 'raffle video' })
  }

  assignFiles (events, videoIndices) {
    const fileIndices = this.files.map((_, i) => i)
    const videoFileIndices = shuffle(new Array(videoIndices).fill(0).map(() => sample(fileIndices)))
    const imageFileIndices = shuffle(fileIndices.filter(index => !videoFileIndices.includes(index)))
    events.forEach((event, i) => {
      if (event.displayType === 'raffle video') {
        event.file = `${this.files[videoFileIndices.shift()]}.mp4`
      } else {
        event.file = `${this.files[imageFileIndices.shift()]}.png`
      }
    })
  }

  generateEvents (events, videoEvents, videoIndices) {
    videoEvents = shuffle(videoEvents)
    const nonVideoEvents = shuffle(events.filter(event => !videoEvents.includes(event)))
    return new Array(events.length).fill(0).map((_, i) => {
      return (videoIndices.includes(i) ? videoEvents : nonVideoEvents).shift()
    })
  }
}

function sample (array, remove=true) {
  const index = Math.floor(Math.random() * array.length)
  const item = array[index]
  if (remove) {
    array.splice(index, 1)
  }
  return item
}

function shuffle (array) {
  const shuffledArray = []
  while (array.length > 0) {
    const index = Math.floor(Math.random() * array.length)
    shuffledArray.push(array[index])
    array.splice(index, 1)
  }
  return shuffledArray
}

function random (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}