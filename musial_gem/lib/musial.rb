require 'musial/version'

require 'awesome_print'
require 'midilib'
require 'midilib/sequence'
require 'midilib/consts'
require 'midilib/utils'
require "stattleship"

include MIDI
include Stattleship

module Musial
  def self.perform(game_id: 'mlb-2017-mil-sf-2017-03-19-1605')
    # Construct params for the fetch
    query_params = Params::PitchesParams.new

    query_params.season_id = 'mlb-2017'
    query_params.interval_type = 'preseason'
    query_params.game_id = game_id

    pitches = Pitches.fetch(params: query_params)

    # puts pitches.map(&:to_sentence)

    seq = Sequence.new()

    tone_js = {}

    header = {
               'name' => 'my Song',
               'bpm' => 140,
               'timeSignature' => [4,4],
               'PPQ' => 480,
             }

    tone_js['header'] = header

    notes = []

    controlChanges = {}


    pitches.each do |pitch|

      next unless pitch.pitch_speed > 0 && pitch.pitch_speed < 106

      duration = seq.note_to_length('quarter')

      note_event = NoteEvent.new(0,
                                 0,
                                 pitch.pitch_speed - 32,
                                 127,
                                 duration)

      note_event.print_note_names = true

      note  = { 'midi' => 0,
                'time' => 0,
                'note' => note_event.note_to_s,
                'velocity' => note_event.velocity,
                'duration' => duration,
                'meta' => pitch.dump,
              }

      notes << note

    end

    instrument_number = 0

    track = {
              'id' => 1,
              'name' => 'name',
              'notes' => notes,
              'startTime' => 0,
              'duration' => 1,
              'controlChanges' => {},
              'isPercussion' => false,
              'channelNumber' => 1,
              'instrumentNumber' => instrument_number,
              'instrument' => GM_PATCH_NAMES[instrument_number],
            }

    tone_js['tracks'] = []

    tone_js['tracks'] << track

    File.write("../web/songs/#{game_id}_song.json", Oj.dump(tone_js, mode: :compat))

    true

  end
end
