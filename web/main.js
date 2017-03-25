function main()  {
  let scorePromise = loadScore()
  let instrumentsPromise = loadInstruments()
  Promise.all([scorePromise, instrumentsPromise]).then((loadResults) => {
    let score = loadResults[0]
    let instruments = loadResults[1]
    musialGui = new MusialGui({
      instruments,
      score
    })
    document.body.appendChild(musialGui.rootEl)
    musialGui.render()
  })
}

function loadInstruments() {
  let instrumentNames = [
    'celesta',
  ]
  let instrumentPromises = []
  let ac = Tone.context
  for (let instrumentName of instrumentNames) {
    let instrumentPromise = Soundfont.instrument(ac, instrumentName)
    instrumentPromises.push(instrumentPromise)
  }
  instrumentsPromise = Promise.all(instrumentPromises).then(instruments => {
    let keyedInstruments = {}
    for (let i = 0; i < instruments.length; i++) {
      let instrument = instruments[i]
      let instrumentName = instrumentNames[i]
      keyedInstruments[instrumentName] = instrument
    }
    return keyedInstruments
  })
  return instrumentsPromise
}

function loadScore() {
  //let score = genScore()
  let songUrl = 'songs/mlb-2016-chc-cle-2016-11-2-0400_song.json'
  let scorePromise = fetch(songUrl).then((response) => {
    return response.json()
  })
  return scorePromise
}

class MusialGui {
  constructor (kwargs) {
    kwargs = kwargs || {}
    this.rootEl = document.createElement('div')
    this.score = kwargs.score
    this.instruments = kwargs.instruments
  }

  render() {
    this.setTitle()
    this.rootEl.appendChild(this.renderPlayButton())
    this.rootEl.appendChild(this.renderPitchBox())
    this.rootEl.appendChild(this.renderTrackName())
  }

  setTitle() {
    let titleEl = document.getElementById('title')
    titleEl.innerHTML = this.score.header.name
  }

  renderTrackName() {
    let trackEl = document.createElement('div')
    trackEl.innerHTML = `Track: this.score.tracks[0].name`
    return trackEl
  }

  renderPlayButton() {
    let button = document.createElement('button')
    button.innerHTML = 'play'
    button.addEventListener('click', () => {
      console.log('play')
      new ScorePlayer({
        instruments: this.instruments,
        onPlayNote: this.onPlayNote.bind(this),
      }).playScore({
        score: this.score
      })
    })
    return button
  }

  renderPitchBox() {
    let pitchBox = document.createElement('div')
    pitchBox.id = 'pitchBox'
    pitchBox.innerHTML = `
    <table>
      <tr>
        <td class="left">${this.genPitchZoneHtml({zone: 13})}</td>
        <td class="middle">
          <table>
            <tr><td class="top">${this.genPitchZoneHtml({zone: 10})}</td></tr>
            <tr><td>${this.genStrikeZoneTableHtml()}</td></tr>
            <tr><td class="bottom">${this.genPitchZoneHtml({zone: 12})}</td></tr>
          </table>
        </td>
        <td class="right">${this.genPitchZoneHtml({zone: 11})}</td>
    </tr></table>
    `
    return pitchBox
  }

  genPitchZoneHtml (kwargs) {
    return `<div class="zone" id="zone-${kwargs.zone}">zone-${kwargs.zone}</div>`
  }

  genStrikeZoneTableHtml () {
    let table = document.createElement('table')
    let tr
    for (let i = 0; i < 9; i++) {
      if ((i % 3) == 0) {
        tr = document.createElement('tr')
        table.appendChild(tr)
      }
      let td = document.createElement('td')
      tr.appendChild(td)
      td.innerHTML = this.genPitchZoneHtml({zone: i + 1})
    }
    return `<table class="strike-zone-table">${table.innerHTML}</table>`
  }

  onPlayNote (kwargs) {
    let note = kwargs.note
    let pitchZone = note.meta.pitch_zone
    this.highlightPitchZone({pitchZone})
  }

  highlightPitchZone (kwargs) {
    let {pitchZone} = kwargs
    let pitchZoneEl = document.getElementById(`zone-${pitchZone}`)
    let deactivationDelay = 100
    pitchZoneEl.classList.add('highlight')
    setTimeout(() => {
      pitchZoneEl.classList.remove('highlight')
    }, deactivationDelay)
  }

}

class ScorePlayer {
  constructor(kwargs) {
    this.instruments = kwargs.instruments
    this.onPlayNote = kwargs.onPlayNote
  }

  genSynth() {
    let synth = new Tone.FMSynth().toMaster();
    return synth
  }

  playScore(kwargs) {
    let score = kwargs.score || {}
    let bpm = score.header.bpm || 140
    new Tone.PluckSynth().toMaster();
    let tracks = [score.tracks[0]]
    for (let i = 0; i < tracks.length; i++) {
      let track = score.tracks[i]
      let instrumentName = Object.keys(this.instruments)[i]
      let instrument = this.instruments[instrumentName]
      let synth = this.genSynth()
      let notes = track.notes
      //notes = notes.slice(0, 10)
      let curTime = 0
      var renderedTrack = new Tone.Part((time, event) => {
        let duration = event.duration
        let noteName = event.note
        let velocity = event.velocity / 127
        let pitchZone = event.meta.pitch_zone
        this.scheduleNote({
          duration,
          instrument,
          noteName,
          time: curTime,
          velocity,
        })

        Tone.Draw.schedule(() => {
          this.onPlayNote({note: event})
        }, curTime)

        curTime += duration
      }, notes).start()
    }
    Tone.Transport.start()
  }

  scheduleNote(kwargs) {
    console.log("scheduleNote: ", kwargs)
    //this.scheduleSynthNote(kwargs)
    this.scheduleInstrumentNote(kwargs)
  }

  scheduleSynthNote(kwargs) {
    synth.triggerAttackRelease(
      kwargs.noteName,
      kwargs.duration,
      kwargs.time,
      kwargs.velocity
    )
  }

  scheduleInstrumentNote(kwargs) {
    let instrument = kwargs.instrument
    instrument.play(
      kwargs.noteName,
      kwargs.time,
      {
        duration: kwargs.duration
      }
    )
  }
}

function genScore(kwargs) {
  kwargs = kwargs || {}
  numNotes = kwargs.numNotes || 3
  let score = {
    header: {
      bpm: 120,
    },
    tracks: [
      {
        startTime: 0,
        duration: 127.28854166666662,
        length: 147,
        id: 1,
        name: "Bass",
        instrumentNumber: 33,
        instrument: "electric bass (finger)",
        instrumentFamily: "bass",
        channelNumber: 0,
        isPercussion: false,
        notes: genNotes({numNotes}),
      }
    ]
  }
  return score
}

function genNotes(kwargs) {
  kwargs = kwargs || {}
  let curTime = kwargs.startTime || 0
  let numNotes = kwargs.numNotes || 3
  let noteDuration = kwargs.noteDuration || 0.25
  notes = []
  for (let i = 0; i < numNotes; i++) {
    note = genNote({
      time: curTime,
      duration: noteDuration
    })
    notes.push(note)
    curTime += noteDuration
  }
  return notes
}

function genNote(kwargs) {
  let {time, duration} = kwargs
  let note = {
    "name": genRandomNoteName(),
    "midi": null,
    "time": 0,
    "velocity": 0.6141732283464567,
    "duration": duration,
  }
  return note
}

function genRandomNoteName() {
  let LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  let octave = 4
  let noteLetter = LETTERS[randomInt({max: LETTERS.length})]
  let noteName = [noteLetter, octave].join('')
  return noteName
}

function randomInt(kwargs) {
  let max = kwargs.max
  let min = kwargs.min || 0
  return Math.floor(Math.random() * (max - min)) + min;
}

main()
