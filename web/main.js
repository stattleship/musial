function main()  {
  let scorePromise = loadScore()
  scorePromise.then((score) => {
    musialGui = new MusialGui({
      score,
      scorePlayer: new ScorePlayer()
    })
    document.body.appendChild(musialGui.rootEl)
    musialGui.render()
  })
}

function loadScore() {
  //let score = genScore()
  let songUrl = 'songs/mlb-2017-mil-sf-2017-03-19-1605_song.json'
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
    this.scorePlayer = kwargs.scorePlayer
  }

  render() {
    let playButton = this.renderPlayButton()
    this.rootEl.appendChild(playButton)
  }

  renderPlayButton() {
    let button = document.createElement('button')
    button.innerHTML = 'play'
    button.addEventListener('click', () => {
      console.log('play')
      this.scorePlayer.playScore({score: this.score})
    })
    return button
  }

  renderForm() {
    let formHtml = `
    foo
    cow
    `
  }

}

class ScorePlayer {
  constructor(kwargs) {
    this.synth = this.genSynth()
  }

  genSynth() {
    let synth = new Tone.PolySynth(8).toMaster()
    return synth
  }

  playScore(kwargs) {
    let score = kwargs.score || {}
    let bpm = score.header.bpm || 140
    for (let track of score.tracks) {
      let notes = track.notes
      //notes = notes.slice(0, 10)
      let curTime = 0
      var renderedTrack = new Tone.Part((time, note) => {
        let duration = note.duration * 1e-3
        let noteName = note.note
        let velocity = note.velocity
        this.synth.triggerAttackRelease(
          noteName,
          duration,
          curTime,
          velocity
        )
        console.log(curTime, duration, noteName, velocity)
        curTime += duration
      }, notes).start()
    }
    Tone.Transport.start()
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
