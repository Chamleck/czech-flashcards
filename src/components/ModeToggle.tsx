import React from "react";
import { Text } from "react-native";
import { theme } from "../utils/theme";
import { SegmentTabs } from "./SegmentTabs";

// Перемикач режиму на екранах категорій: Тренування ↔ Перегляд.
// "browse" веде тап по категорії в режим перегляду (список без чекбоксів → картки
// зі свайпом) замість запуску тренувальної сесії. Один компонент на всі частини мови.
export type BrowseMode = "train" | "browse";

const LABELS: Record<BrowseMode, string> = {
  train: "Тренування",
  browse: "Перегляд",
};

// Емодзі — окремою іконкою через iconFor, а не вклеєні в labelFor. Це той самий
// патерн, що і в усіх інших SegmentTabs (рід/ступінь/час, див. GenderIcon).
// Раніше емодзі було вклеєне прямо в рядок — єдина відмінність ModeToggle від
// решти табів (кнопка з ОДНИМ Text-дитям замість icon+Text) виявилась причиною
// бага на Samsung Galaxy S21 Ultra: підпис активного табу зникав. Підтверджено
// емпірично — інші SegmentTabs з iconFor на тому ж пристрої не мали проблеми.
const ICON: Record<BrowseMode, string> = {
  train: "🎯",
  browse: "📖",
};

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: BrowseMode;
  onChange: (m: BrowseMode) => void;
}) {
  return (
    <SegmentTabs
      options={["browse", "train"] as const}
      active={mode}
      onSelect={onChange}
      colorFor={() => theme.colors.lilac}
      labelFor={(m) => LABELS[m]}
      iconFor={(m) => <Text>{ICON[m]}</Text>}
      minWidth={130}
      flexBasis="48%"
    />
  );
}
