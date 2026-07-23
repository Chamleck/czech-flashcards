import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

// Звуки квізу на expo-audio (замінив expo-av, який не збирався під RN 0.85 / SDK 56).
//
// mixWithOthers на Android не запитує audio focus — це прибирає причину, через яку
// expo-av "губив" перший тап (асинхронний запит фокусу після холодного старту).
// Але лишається окрема, вже платформна причина: холодний старт аудіо-підсистеми
// Android (AudioFlinger/HAL) для процесу, що ще ЖОДНОГО разу не програвав звук,
// сам по собі вимагає часу на "прокидання". Це не race condition навколо нашого
// коду, а холодний старт нативного шару ОС — J S-хитрощами з таймінгом (перевірено
// емпірично на expo-av: 4 різні спроби не змінили поведінку) її обійти не можна.
// Единий визнаний у спільноті expo-audio workaround — реальний play()+pause() одразу
// після ініціалізації, щоб "розбудити" аудіо-шар заздалегідь, поки користувач ще
// навігує до квізу. Це не гарантія, а пом'якшення, і як компроміс ми на цьому
// зупиняємось: якщо тиша на найпершому тапі колись все ж проскочить — вважаємо
// це прийнятним рідкісним edge-case, не ганяємось за ним далі.

let correctPlayer: AudioPlayer | null = null;
let wrongPlayer: AudioPlayer | null = null;
let ready = false;

async function init(): Promise<void> {
  try {
    // ВАЖЛИВО: await тут обов'язковий. Без нього createAudioPlayer міг виконатися
    // раніше, ніж mixWithOthers реально застосується — і поведінка тихо відкочується
    // до дефолтного (Android знову асинхронно запитує audio focus).
    await setAudioModeAsync({ interruptionMode: "mixWithOthers", playsInSilentMode: true });

    correctPlayer = createAudioPlayer(require("../../assets/sounds/correct.wav"));
    wrongPlayer = createAudioPlayer(require("../../assets/sounds/wrong.wav"));

    // Прогрів: реальний play() на ОБОХ плеєрах (не лише виставлення volume — сам
    // виклик play() і є тим, що "будить" аудіо-шар), одразу гасимо назад.
    for (const p of [correctPlayer, wrongPlayer]) {
      p.volume = 0;
      p.play();
    }
    setTimeout(() => {
      for (const p of [correctPlayer, wrongPlayer]) {
        if (!p) continue;
        try {
          p.pause();
          p.seekTo(0);
          p.volume = 1;
        } catch {
          // не критично
        }
      }
    }, 150);

    ready = true;
  } catch {
    ready = false;
  }
}

init();

export function playCorrect(): void {
  if (!ready || !correctPlayer) return;
  try {
    correctPlayer.seekTo(0);
    correctPlayer.play();
  } catch {
    // звук не критичний
  }
}

export function playWrong(): void {
  if (!ready || !wrongPlayer) return;
  try {
    wrongPlayer.seekTo(0);
    wrongPlayer.play();
  } catch {
    // звук не критичний
  }
}