require "spec_helper"

describe Musial do
  it "has a version number" do
    expect(Musial::VERSION).not_to be nil
  end

  it 'fetches pitches' do
      ap Musial.perform
  end
end
