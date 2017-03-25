function main()  {
  let soundRenderer = new SoundRenderer()
  let events = loadEvents()
  soundRenderer.playEvents({events})
}

class SoundRenderer {
  constructor(kwargs) {
    this.synth = new Tone.Synth().toMaster();
  }
  playEvents(kwargs) {
    let {events} = kwargs
    for (let event of events) {
      this.playEvent({event})
    }
  }

  playEvent(kwargs) {
    let {event} = kwargs
    synth.triggerAttackRelease(
      event.note,
      event.length
    )
  }
}

function loadEvents() {
  let events = genEvents()
  return events
}

function genEvents() {
  return [
  ]
}

function genRandomEvent() {
  event {
    'note': 'C' + randomInt({min: 3, max: 5}),
    'length': '8n'
  }
  return event
}

function randomInt(kwargs) {
  max = kwargs.max
  min = kwargs.min or 0
  return Math.floor(Math.random() * (max - min)) + min;
}

main()
