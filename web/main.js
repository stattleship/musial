function main()  {
  let scorePromise = loadScore()
  let instrumentsPromise = loadInstruments()
  Promise.all([scorePromise, instrumentsPromise]).then((loadResults) => {
    let score = loadResults[0]
    let instruments = loadResults[1]
    let trackNumber = 0
    musialGui = new MusialGui({
      instruments,
      score,
      trackNumber
    })
    let mainContainer = document.getElementById('main-container')
    mainContainer.appendChild(musialGui.rootEl)
    musialGui.render()
  })
}

function loadInstruments() {
  let instrumentNames = [
    // 'voice_oohs',
    // 'melodic_tom',
    'pad_3_polysynth',
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
  let songParam = getParameterByName('song') || 'mlb-2016-la-chc-2016-10-22-0300'
  let songUrl = `songs/${songParam}_song.json`
  let scorePromise = fetch(songUrl).then((response) => {
    return response.json()
  })
  return scorePromise
}

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

class MusialGui {
  constructor (kwargs) {
    kwargs = kwargs || {}
    this.rootEl = document.createElement('div')
    this.score = kwargs.score
    this.instruments = kwargs.instruments
    this.trackNumber = kwargs.trackNumber

  }

  render() {
    this.setTitle()
    this.rootEl.appendChild(this.renderPlayButton())
    this.rootEl.appendChild(this.renderPitchBox())
    this.rootEl.appendChild(this.renderTrackName())
    this.rootEl.appendChild(this.renderPitchInfo())
  }

  setTitle() {
    let titleEl = document.getElementById('title')
    titleEl.innerHTML = this.score.header.name
  }

  renderTrackName() {
    let trackEl = document.createElement('div')
    trackEl.id = 'trackName'
    trackEl.classList.add('track-name')
    trackEl.innerHTML = `Track: ${this.score.tracks[this.trackNumber].name}`
    return trackEl
  }

  renderPitchInfo() {
    let pitchInfoEl = document.createElement('div')
    pitchInfoEl.id = 'pitchInfo'
    pitchInfoEl.classList.add('pitch-info')
    pitchInfoEl.innerHTML = 'Pitch: '
    return pitchInfoEl
  }

  renderPlayButton() {
    let button = document.createElement('button')
    button.id = 'playButton'
    button.innerHTML = 'Play'
    button.addEventListener('click', () => {
      console.log('play ball!')

      if (Tone.Transport.state != 'started') {
        new ScorePlayer({
          instruments: this.instruments,
          onPlayNote: this.onPlayNote.bind(this),
        }).playScore({
          score: this.score
        })
      }
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
    return `<div class="zone" id="zone-${kwargs.zone}">&nbsp;</div>`
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

    let pitchInfo = `Pitch ${note.meta.pitch_count}: ${note.meta.pitch_description}`

    let trackName = `${note.meta.inning_label} - ${note.meta.team_name} - ${note.meta.pitcher_name}`
    this.genPitchInfo({pitchInfo})

    this.genTrackName({trackName})

    this.highlightPitchZone({pitchZone})


  }

  highlightPitchZone (kwargs) {
    let {pitchZone} = kwargs
    let pitchZoneEl = document.getElementById(`zone-${pitchZone}`)
    let deactivationDelay = 100
    pitchZoneEl.classList.add('highlight')

    let pitchInfoEl = document.getElementById('pitchInfo')
    pitchInfoEl.classList.add('highlight')

    // let trackNameEl = document.getElementById('trackName')
    // trackNameEl.classList.add('highlight')

    setTimeout(() => {
      pitchZoneEl.classList.remove('highlight')
    }, deactivationDelay)

    setTimeout(() => {
      pitchInfoEl.classList.remove('highlight')
      // trackNameEl.classList.remove('highlight')
    }, deactivationDelay * 2)

  }

  genPitchInfo (kwargs) {
    let pitchInfoEl = document.getElementById('pitchInfo')
    let {pitchInfo} = kwargs
    pitchInfoEl.innerHTML = `${pitchInfo}`
  }

  genTrackName (kwargs) {
    let trackNameEl = document.getElementById('trackName')
    let {trackName} = kwargs
    trackNameEl.innerHTML = `Track: ${this.score.tracks[this.trackNumber].name} - ${trackName}`
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
    console.log(Tone.Transport.state)
    let score = kwargs.score || {}
    let bpm = score.header.bpm || 140
    let tracks = [score.tracks[this.trackNumber]]
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

// function genScore(kwargs) {
//   kwargs = kwargs || {}
//   numNotes = kwargs.numNotes || 3
//   let score = {
//     header: {
//       bpm: 120,
//     },
//     tracks: [
//       {
//         startTime: 0,
//         duration: 127.28854166666662,
//         length: 147,
//         id: 1,
//         name: "Bass",
//         instrumentNumber: 33,
//         instrument: "electric bass (finger)",
//         instrumentFamily: "bass",
//         channelNumber: 0,
//         isPercussion: false,
//         notes: genNotes({numNotes}),
//       }
//     ]
//   }
//   return score
// }

// function genNotes(kwargs) {
//   kwargs = kwargs || {}
//   let curTime = kwargs.startTime || 0
//   let numNotes = kwargs.numNotes || 3
//   let noteDuration = kwargs.noteDuration || 0.25
//   notes = []
//   for (let i = 0; i < numNotes; i++) {
//     note = genNote({
//       time: curTime,
//       duration: noteDuration
//     })
//     notes.push(note)
//     curTime += noteDuration
//   }
//   return notes
// }

// function genNote(kwargs) {
//   let {time, duration} = kwargs
//   let note = {
//     "name": genRandomNoteName(),
//     "midi": null,
//     "time": 0,
//     "velocity": 0.6141732283464567,
//     "duration": duration,
//   }
//   return note
// }

// function genRandomNoteName() {
//   let LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
//   let octave = 4
//   let noteLetter = LETTERS[randomInt({max: LETTERS.length})]
//   let noteName = [noteLetter, octave].join('')
//   return noteName
// }

// function randomInt(kwargs) {
//   let max = kwargs.max
//   let min = kwargs.min || 0
//   return Math.floor(Math.random() * (max - min)) + min;
// }

main()
