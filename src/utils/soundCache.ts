import { Audio } from "expo-av";

// На Android перший виклик playAsync у щойно налаштованому аудіорежимі асинхронно
// запитує audio focus і на цю мить може провалюватися в тишину. Раніше звуки
// завантажувались і "прогрівались" заново при КОЖНОМУ вході в екран квізу (екран
// розмонтовується при поверненні до категорій → unloadAsync → наступного разу все
// спочатку) — тому вікно тиші повторювалось у кожному новому раунді, а не лише
// один раз за весь час роботи застосунку.
//
// Рішення: завантажуємо звуки й налаштовуємо audio mode ОДИН РАЗ за життя застосунку
// через модульний синглтон-кеш, що переживає розмонтування екрана. Наступні входи
// в квіз перевикористовують уже готові, прогріті об'єкти — без нового вікна тиші.

let correctSound: Audio.Sound | null = null;
let wrongSound: Audio.Sound | null = null;
let loadingPromise: Promise<{ correct: Audio.Sound; wrong: Audio.Sound }> | null = null;

async function warmUp(sound: Audio.Sound): Promise<void> {
  try {
    await sound.setVolumeAsync(0);
    // ВАЖЛИВО: прогріваємо саме тим методом, який реально викликає гра при кліку —
    // replayAsync(), а не playAsync(). Це різні виклики в expo-av, і є відомі
    // особливості Android/ExoPlayer, коли саме ПЕРШИЙ виклик replayAsync() на об'єкті
    // поводиться інакше, ніж перший playAsync() (потребує повторної підготовки після
    // stopAsync). Раніше прогрів "спалював" перший playAsync, а гра викликала
    // replayAsync — тобто прогрівався не той метод, який реально грав під час кліку.
    await sound.replayAsync();
    await new Promise((r) => setTimeout(r, 120));
    await sound.stopAsync();
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(1);
  } catch {
    // прогрів не вдався — не критично, гра працює й без нього
  }
}

// Повертає вже готові звуки (з кешу) або завантажує й прогріває їх ОДИН РАЗ
// (паралельні виклики під час першого завантаження чекають той самий проміс,
// а не запускають завантаження повторно).
export function getQuizSounds(): Promise<{ correct: Audio.Sound; wrong: Audio.Sound }> {
  if (correctSound && wrongSound) {
    return Promise.resolve({ correct: correctSound, wrong: wrongSound });
  }
  if (!loadingPromise) {
    const p = (async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const c = await Audio.Sound.createAsync(require("../../assets/sounds/correct.wav"));
      const w = await Audio.Sound.createAsync(require("../../assets/sounds/wrong.wav"));
      // Прогріваємо ОБИДВА звуки паралельно (не послідовно) — це вдвічі скорочує
      // сумарний час до готовності, звужуючи вікно, у яке може влучити перший тап.
      await Promise.all([warmUp(c.sound), warmUp(w.sound)]);
      correctSound = c.sound;
      wrongSound = w.sound;
      return { correct: c.sound, wrong: w.sound };
    })();
    // Скидання реєструємо ОКРЕМИМ .catch на вже створеному промісі, а не всередині
    // його власного тіла: якщо скидати loadingPromise=null у власному try/catch цієї
    // ж IIFE, зовнішнє присвоєння "loadingPromise = (async()=>{...})()" виконається
    // ПІСЛЯ внутрішнього скидання і перезапише його значенням зламаного промісу —
    // наступний виклик тоді знову отримає той самий відхилений проміс замість повтору.
    p.catch(() => {
      loadingPromise = null;
    });
    loadingPromise = p;
  }
  return loadingPromise;
}

// Запускаємо прогрів ОДРАЗУ при завантаженні цього модуля — тобто ще до першого
// рендеру App і будь-якого useEffect. Модуль обчислюється під час резолву імпортів,
// раніше за будь-який життєвий цикл компонента, тож це максимально скорочує вікно
// між стартом застосунку й моментом, коли користувач встигне зробити перший тап.
getQuizSounds().catch(() => {
  // звук не критичний — застосунок працює й без нього
});
