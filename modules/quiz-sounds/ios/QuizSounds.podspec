Pod::Spec.new do |s|
  s.name           = 'QuizSounds'
  s.version        = '1.0.0'
  s.summary        = 'Short quiz sound effects (Android SoundPool; no-op stub on iOS)'
  s.description    = 'Local Expo module playing short UI sounds via Android SoundPool.'
  s.license        = 'MIT'
  s.author         = ''
  s.homepage       = 'https://github.com/Chamleck/czech-flashcards'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
