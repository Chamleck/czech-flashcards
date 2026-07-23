import ExpoModulesCore

// Заглушка для iOS. SoundPool — Android-only API, а iOS у цьому проєкті не є цільовою
// платформою (секції "ios" немає в app.json, eas.json збирає лише Android APK).
//
// Функції існують і нічого не роблять: якщо колись збиратимемо під iOS, застосунок
// скомпілюється й працюватиме — просто беззвучно, без падінь. Свідомо НЕ пишемо тут
// неперевірену реалізацію: код, який ніхто ніколи не запускав, гірший за явну прогалину.
//
// Коли iOS стане реальною ціллю — правильний еквівалент це AVAudioEngine з
// попередньо декодованим AVAudioPCMBuffer (аналог SoundPool за архітектурою).
// JS-інтерфейс при цьому не зміниться: playCorrect() / playWrong() лишаються ті самі.
public class QuizSoundsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("QuizSounds")

    Function("playCorrect") {
      // no-op на iOS
    }

    Function("playWrong") {
      // no-op на iOS
    }

    Function("isReady") { () -> Bool in
      false
    }
  }
}
