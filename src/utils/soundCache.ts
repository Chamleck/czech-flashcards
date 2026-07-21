import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

// Звуки квізу на новому API expo-audio (замінив застарілий expo-av, який не
// збирається під React Native 0.85 / SDK 56).
//
// Головне: setAudioModeAsync({ interruptionMode: "mixWithOthers" }) на Android
// ВЗАГАЛІ не запитує audio focus (це офіційно рекомендований режим для коротких
// UI-звуків). Саме асинхронний запит audio focus у старого expo-av був причиною
// тиші на першому натисканні — тут цієї проблеми не існує в принципі, тому весь
// колишній код "прогріву" (warmUp, холості програвання, soundsReady-гейт) прибрано
// як непотрібний. Код став простішим, ніж був до всіх звукових багфіксів.
//
// Плеєри створюємо через createAudioPlayer (а не хук useAudioPlayer), бо їм треба
// пережити розмонтування екрана квізу — вони живуть у модульному кеші весь час
// роботи застосунку. release() не викликаємо навмисно: кеш існує до кінця процесу.

let correctPlayer: AudioPlayer | null = null;
let wrongPlayer: AudioPlayer | null = null;
let ready = false;

// Ініціалізуємо один раз при завантаженні модуля (до першого рендеру).
try {
  setAudioModeAsync({ interruptionMode: "mixWithOthers", playsInSilentMode: true });
  correctPlayer = createAudioPlayer(require("../../assets/sounds/correct.wav"));
  wrongPlayer = createAudioPlayer(require("../../assets/sounds/wrong.wav"));
  ready = true;
} catch {
  // звук не критичний — гра працює й без нього
  ready = false;
}

// Програти звук з початку. seekTo(0)+play() — прямий аналог колишнього replayAsync().
export function playCorrect(): void {
  if (!ready || !correctPlayer) return;
  try {
    correctPlayer.seekTo(0);
    correctPlayer.play();
  } catch {
    // ігноруємо — звук не критичний
  }
}

export function playWrong(): void {
  if (!ready || !wrongPlayer) return;
  try {
    wrongPlayer.seekTo(0);
    wrongPlayer.play();
  } catch {
    // ігноруємо — звук не критичний
  }
}
