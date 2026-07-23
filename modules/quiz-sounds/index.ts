import { requireOptionalNativeModule } from "expo";

type QuizSoundsNativeModule = {
  playCorrect(): void;
  playWrong(): void;
  isReady(): boolean;
};

// requireOptionalNativeModule повертає null замість того, щоб кинути виняток, якщо
// нативний модуль недоступний. Це навмисно: звук — некритична функція, і його
// відсутність НІКОЛИ не повинна ламати застосунок. (Урок з попередньої спроби, де
// невдале preload() вимикало весь звук, бо помилка потрапляла в спільний catch.)
const native = requireOptionalNativeModule<QuizSoundsNativeModule>("QuizSounds");

export function playCorrect(): void {
  try {
    native?.playCorrect();
  } catch {
    // звук некритичний — тиша краща за падіння
  }
}

export function playWrong(): void {
  try {
    native?.playWrong();
  } catch {
    // звук некритичний — тиша краща за падіння
  }
}

// Діагностика: чи семпли вже декодовані в пам'ять (на Android). На iOS завжди false —
// там заглушка. Не використовується для блокування відтворення.
export function isReady(): boolean {
  try {
    return native?.isReady() ?? false;
  } catch {
    return false;
  }
}
