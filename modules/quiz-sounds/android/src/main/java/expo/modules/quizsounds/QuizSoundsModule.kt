package expo.modules.quizsounds

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections

/**
 * Короткі звуки квізу через SoundPool — API, який Android створив саме для звукових
 * ефектів (клік, бііп), на відміну від MediaPlayer/ExoPlayer для музики та відео.
 *
 * Чому це принципово: ExoPlayer (на якому побудований expo-audio) виконує всю важку
 * роботу — створення media source, буферизацію, створення AudioTrack, запуск декодера —
 * у момент play(). Наші звуки тривають 0.28-0.29 с, тож поки конвеєр прокидається,
 * короткий звук встигає програти в тишу. Саме тому перший тап після холодного старту
 * лишався німим, скільки б ми не намагалися вгадати момент готовності.
 *
 * SoundPool робить навпаки: декодує файл у PCM і тримає його в пам'яті на етапі load(),
 * тобто на старті застосунку, і повідомляє про завершення через OnLoadCompleteListener.
 * У момент play() лишається тільки підмішати вже готовий PCM — роботи майже немає.
 *
 * Атрибути USAGE_ASSISTANCE_SONIFICATION + CONTENT_TYPE_SONIFICATION — офіційно
 * рекомендовані Android для звуків, що супроводжують дію користувача. Вони також не
 * запитують audio focus у системи, тож зникає й та причина затримки, з якою ми воювали
 * на expo-av.
 */
class QuizSoundsModule : Module() {
  private var soundPool: SoundPool? = null
  private var correctId = 0
  private var wrongId = 0

  // Які семпли вже декодовані. Потокобезпечно: колбек приходить з іншого потоку.
  private val loadedSamples = Collections.synchronizedSet(mutableSetOf<Int>())

  override fun definition() = ModuleDefinition {
    Name("QuizSounds")

    // Спрацьовує при створенні модуля, тобто на старті застосунку — задовго до того,
    // як користувач дійде до квізу. Саме тут відбувається вся важка робота.
    OnCreate {
      val context: Context = appContext.reactContext ?: return@OnCreate

      val attributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

      val pool = SoundPool.Builder()
        .setMaxStreams(4)
        .setAudioAttributes(attributes)
        .build()

      // Слухача ставимо ДО load(), щоб не проґавити швидке завантаження. Порівнюємо не
      // з полями (вони на цю мить ще можуть бути не присвоєні), а складаємо id у сет —
      // це усуває гонку між load() і колбеком.
      pool.setOnLoadCompleteListener { _, sampleId, status ->
        if (status == 0) {
          loadedSamples.add(sampleId)
        }
      }

      correctId = pool.load(context, R.raw.correct, 1)
      wrongId = pool.load(context, R.raw.wrong, 1)
      soundPool = pool
    }

    OnDestroy {
      soundPool?.release()
      soundPool = null
      loadedSamples.clear()
      correctId = 0
      wrongId = 0
    }

    Function("playCorrect") {
      play(correctId)
    }

    Function("playWrong") {
      play(wrongId)
    }

    // Діагностика: чи обидва семпли вже декодовані. Відтворення на це НЕ зав'язане —
    // play() на незавантаженому семплі просто повертає 0 і нічого не робить, тож
    // навіть якщо тут щось піде не так, звук не зникне через нашу перевірку.
    Function("isReady") {
      loadedSamples.contains(correctId) && loadedSamples.contains(wrongId)
    }
  }

  private fun play(soundId: Int) {
    val pool = soundPool ?: return
    if (soundId == 0) return
    // leftVolume, rightVolume, priority, loop (0 = без повтору), rate
    pool.play(soundId, 1f, 1f, 1, 0, 1f)
  }
}
