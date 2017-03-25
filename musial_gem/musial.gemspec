# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'musial/version'

Gem::Specification.new do |spec|
  spec.name          = "musial"
  spec.version       = Musial::VERSION
  spec.authors       = ["David Thyresson"]
  spec.email         = ["david@stattleship.com"]

  spec.summary       = 'Makes music from baseball pitch data'
  spec.description   = %q{Makes music from baseball pitch data}
  spec.homepage      = "http://www.somewhere.com"
  spec.license       = "MIT"

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata['allowed_push_host'] = ''
  else
    raise "RubyGems 2.0 or newer is required to protect against " \
      "public gem pushes."
  end

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.13"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec", "~> 3.0"

  spec.add_runtime_dependency 'activesupport', '~> 5.0', '>= 5.0.2'
  spec.add_runtime_dependency 'awesome_print', '~> 1.7'
  spec.add_runtime_dependency 'midilib', '~> 2.0', '>= 2.0.5'
  spec.add_runtime_dependency 'stattleship-ruby', '~> 0.1.26'
end
