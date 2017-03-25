require "musial/version"
require 'awesome_print'
require "stattleship"

module Musial
  def self.perform(game_id: 'mlb-2017-mil-sf-2017-03-19-1605')
    # Construct params for the fetch
    query_params = Stattleship::Params::PitchesParams.new

    query_params.season_id = 'mlb-2017'
    query_params.interval_type = 'preseason'
    query_params.game_id = game_id

    pitches = Stattleship::Pitches.fetch(params: query_params)

    # puts pitches.map(&:to_sentence)

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

      note  = { 'midi' => 0,
                'time' => 0,
                'note' => 'C4',
                'velocity' => 1,
                'duration' => pitch.pitch_speed,
                'meta' => pitch.dump,
              }

      notes << note

    end



    track = {
              'id' => 1,
              'name' => 'name',
              'notes' => notes,
              'startTime' => 0,
              'duration' => 1,
              'controlChanges' => {},
              'isPercussion' => false,
              'channelNumber' => 1,
              'instrumentNumber' => 1,
              'instrument' => 'piano',
            }

    tone_js['tracks'] = []

    tone_js['tracks'] << track

    File.write("../web/songs/#{game_id}_song.json", Oj.dump(tone_js, mode: :compat))

    true

  end
end
