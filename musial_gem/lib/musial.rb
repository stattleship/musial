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
    tone_js['tracks'] = []

    track_1_notes = []
    track_2_notes = []

    controlChanges = {}

    track_1 = {
                  'id' => 1,
                  'name' => 'top of inning',
                  'notes' => track_1_notes,
                  'startTime' => 0,
                  'duration' => 1,
                  'controlChanges' => {},
                  'isPercussion' => false,
                  'channelNumber' => 1,
                  'instrumentNumber' => 10,
                  'instrument' => GM_PATCH_NAMES[10],
                }

    track_2 = {
                  'id' => 2,
                  'name' => 'bottom of inning',
                  'notes' => track_2_notes,
                  'startTime' => 0,
                  'duration' => 1,
                  'controlChanges' => {},
                  'isPercussion' => false,
                  'channelNumber' => 1,
                  'instrumentNumber' => 32,
                  'instrument' => GM_PATCH_NAMES[32],
                }

    pitches.each do |pitch|

      next unless pitch.pitch_speed > 0 && pitch.pitch_speed < 106

      duration = seq.note_to_length('eighth')

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

      if pitch.half == 'T'
        track_1_notes << note
      else
        track_2_notes << note
      end
    end

    track_1['notes'] = track_1_notes
    track_2['notes'] = track_2_notes

    tone_js['tracks'] << track_1
    tone_js['tracks'] << track_2

    File.write("../web/songs/#{game_id}_song.json", Oj.dump(tone_js, mode: :compat))

    true

  end
end
