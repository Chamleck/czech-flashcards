import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Speech from "expo-speech";

// Єдина точка озвучення в застосунку. Модульний singleton (не React-контекст) —
// щоб "хто зараз говорить" був СПРАВДІ глобальним і стоп спрацьовував між будь-якими
// компонентами (картки, таблиці, різні екрани), а не лише в межах одного дерева.

type Listener = (id: string | null) => void;
let activeId: string | null = null;
const listeners = new Set<Listener>();

function setActive(id: string | null) {
  activeId = id;
  listeners.forEach((l) => l(id));
}

// Наявність чеського голосу перевіряємо ОДИН раз, лениво (при першому тапі),
// а не при старті застосунку — не гальмуємо запуск заради того, чим можуть і не
// скористатись.
let voiceChecked = false;
let hasCzechVoice = true;

async function ensureVoiceChecked(): Promise<void> {
  if (voiceChecked) return;
  voiceChecked = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    hasCzechVoice = voices.some((v) => v.language?.toLowerCase().startsWith("cs"));
  } catch {
    // Не вдалось перевірити — не блокуємо; спроба speak() сама покаже, чи є голос.
    hasCzechVoice = true;
  }
}

// Дублетні форми ("pánovi / pánu") озвучуємо ОБИДВА варіанти з паузою між ними;
// "/" для TTS не має сенсу (звучить як "дріб") — замінюємо на кому.
function ttsText(raw: string): string {
  return raw.replace(/\s*\/\s*/g, ", ");
}

export async function speak(text: string, id: string): Promise<void> {
  await ensureVoiceChecked();
  if (!hasCzechVoice) {
    Alert.alert(
      "Чеський голос не знайдено",
      "Налаштування → Мова та введення → Синтез мовлення → обери «Google» → натисни ⚙️ поруч → " +
        "«Встановити мовні дані» → знайди чеську (Čeština/cs-CZ) → завантаж.\n\n" +
        "Якщо рушія Google немає у списку — постав «Служби озвучування від Google» з Play Маркету."
    );
    return;
  }
  await Speech.stop(); // не даємо звукам накладатись один на одного
  setActive(id);
  Speech.speak(ttsText(text), {
    language: "cs-CZ",
    rate: 0.75,
    onDone: () => {
      if (activeId === id) setActive(null);
    },
    onStopped: () => {
      if (activeId === id) setActive(null);
    },
    onError: () => {
      if (activeId === id) setActive(null);
    },
  });
}

// Викликати при виході з екрана / переході до іншого слова (свайп, "Знаю",
// "Ще повторити"), щоб озвучення не тривало поверх нового контенту.
export function stopSpeech(): void {
  Speech.stop();
  setActive(null);
}

// Чи саме цей id зараз озвучується (для підсвітки під час програвання).
export function useSpeakingId(): string | null {
  const [id, setId] = useState<string | null>(activeId);
  useEffect(() => {
    listeners.add(setId);
    return () => {
      listeners.delete(setId);
    };
  }, []);
  return id;
}

// Зупиняє озвучення при розмонтуванні екрана (навігація назад, свайп між
// картками тощо). Викликати одним рядком у кожному сесійному/browse-екрані.
export function useStopSpeechOnUnmount(): void {
  useEffect(() => stopSpeech, []);
}
