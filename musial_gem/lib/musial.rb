require 'musial/version'

require 'awesome_print'
require 'midilib'
require 'midilib/sequence'
require 'midilib/consts'
require 'midilib/utils'
require 'oj'
require "stattleship"

include MIDI

module Musial
  def self.perform(since: '2 days ago')

    query_params = Stattleship::Params::BaseballGamesParams.new

    # use a slug, typically 'league-team_abbreviation'
    query_params.team_id = 'mlb-chc'

    # may need to adjust this depending on time of year
    query_params.season_id = 'mlb-2016'
    query_params.interval_type = 'postseason'
    query_params.status = 'ended'

    # fetch will automatically traverse the paginated response links
    games = Stattleship::BaseballGames.fetch(params: query_params)

    playlist = []

    games.each do |game|

      ap game.slug

      playlist << { name: game.name, src: "#{game.slug}_song.json" }

      pitch_query_params = Stattleship::Params::PitchesParams.new

      pitch_query_params.season_id = game.season.slug
      pitch_query_params.interval_type = game.interval_type
      pitch_query_params.game_id = game.slug

      pitches = Stattleship::Pitches.fetch(params: pitch_query_params)

      pitches.sort! { |a,b| b.pitched_at <=> a.pitched_at }

      seq = Sequence.new()

      tone_js = {}

      header = {
                 'name' => game.name,
                 'bpm' => 140,
                 'timeSignature' => [4,4],
                 'PPQ' => 480,
               }

      tone_js['header'] = header
      tone_js['tracks'] = []

      track_1_notes = []
      track_2_notes = []
      track_3_notes = []

      controlChanges = {}

      track_1 = {
                    'id' => 1,
                    'name' => game.name,
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
                    'name' => "#{game.home_team_name} Pitching",
                    'notes' => track_2_notes,
                    'startTime' => 0,
                    'duration' => 1,
                    'controlChanges' => {},
                    'isPercussion' => false,
                    'channelNumber' => 1,
                    'instrumentNumber' => 32,
                    'instrument' => GM_PATCH_NAMES[32],
                  }

      track_3 = {
                    'id' => 3,
                    'name' => "#{game.away_team_name} Pitching",
                    'notes' => track_3_notes,
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

        note_type = case pitch.pitch_type
                      when 'CH'
                        'sixteenth'
                      when 'CT'
                        'eighth'
                      when 'CU'
                        'eighth'
                      when 'FA'
                        'sixtyfourth'
                      when 'FO'
                        'quarter'
                      when 'IB'
                        'whole'
                      when 'KN'
                        'whole'
                      when 'PI'
                        'thirtysecond'
                      when 'SC'
                        'quarter'
                      when 'SI'
                        'eighth'
                      when 'SL'
                        'eighth'
                      when 'SP'
                        'quarter'
                      else
                        'whole'
                    end

        duration = seq.note_to_length(note_type)

        loudness = if pitch.pitch_zone < 10
                     127
                   else
                     100
                   end

        note_event = NoteEvent.new(0,
                                   0,
                                   pitch.pitch_speed - 32,
                                   loudness,
                                   duration)

        note_event.print_note_names = true

        note  = { 'midi' => 0,
                  'time' => 0,
                  'note' => note_event.note_to_s,
                  'velocity' => note_event.velocity,
                  'duration' => duration,
                  'meta' => pitch.dump,
                }

        track_1_notes << note

        if pitch.half == 'T'
          track_2_notes << note
        else
          track_3_notes << note
        end
      end

      track_1['notes'] = track_1_notes
      track_2['notes'] = track_2_notes
      track_3['notes'] = track_3_notes

      tone_js['tracks'] << track_1
      tone_js['tracks'] << track_2
      tone_js['tracks'] << track_3

      File.write("../web/songs/#{game.slug}_song.json", Oj.dump(tone_js, mode: :compat))
    end


    File.write("../web/songs/playlist.json", Oj.dump({ songs: playlist }, mode: :compat))

    true

  end
end
