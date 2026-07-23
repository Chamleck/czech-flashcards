import { createAudioPlayer, setAudioModeAsync, preload, type AudioPlayer } from "expo-audio";

// Звуки квізу на expo-audio (замінив expo-av, який не збирався під RN 0.85 / SDK 56).
//
// mixWithOthers на Android не запитує audio focus — це прибирає причину, через яку
// expo-av "губив" перший тап (асинхронний запит фокусу після холодного старту).
//
// ОКРЕМА причина тиші, знайдена пізніше й підтверджена офіційним issue розробників
// (expo/expo #42900, лютий 2026): expo-audio НЕ має справжньої попередньої буферизації
// звуку — вона починається лише по виклику play(), що дає помітну затримку саме для
// коротких UI-звуків. Офіційний issue прямо каже: "expo-audio doesn't fit for sound
// effects or UI sound interaction like clicks". Офіційне рішення — preload(source):
// запускає буферизацію заздалегідь (у module scope, до рендеру), так що подальший
// play() стартує "near-instantly".
//
// Прогрів (play+pause одразу після ініціалізації) лишаємо як ДОДАТКОВИЙ захист від
// іншої, платформної причини: холодний старт аудіо-підсистеми Android (AudioFlinger/
// HAL) для процесу, що ще ЖОДНОГО разу не програвав звук. Ці дві причини незалежні
// одна від одної, тому обидва пом'якшення лишаємо разом, а не заміняємо одне іншим.
// Це все ще не стовідсоткова гарантія (перевірено емпірично: J S-хитрощі з таймінгом
// на expo-av чотири рази поспіль не змінювали поведінку) — якщо тиша на найпершому
// тапі колись все ж проскочить, вважаємо це прийнятним рідкісним edge-case.

let correctPlayer: AudioPlayer | null = null;
let wrongPlayer: AudioPlayer | null = null;
let ready = false;

async function init(): Promise<void> {
  try {
    // ВАЖЛИВО: await тут обов'язковий. Без нього createAudioPlayer міг виконатися
    // раніше, ніж mixWithOthers реально застосується — і поведінка тихо відкочується
    // до дефолтного (Android знову асинхронно запитує audio focus).
    await setAudioModeAsync({ interruptionMode: "mixWithOthers", playsInSilentMode: true });

    const correctSource = require("../../assets/sounds/correct.wav");
    const wrongSource = require("../../assets/sounds/wrong.wav");

    // Офіційний preload(): починає буферизацію ДО того, як гравець реально потрібен.
    await Promise.all([preload(correctSource), preload(wrongSource)]);

    correctPlayer = createAudioPlayer(correctSource);
    wrongPlayer = createAudioPlayer(wrongSource);

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