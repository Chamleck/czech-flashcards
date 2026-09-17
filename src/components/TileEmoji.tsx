import React from "react";
import { SvgXml } from "react-native-svg";
import { TILE_EMOJI, TileEmojiName } from "./icons/tileEmoji";

// Декоративна іконка змісту плитки — Twemoji, див. icons/tileEmoji.ts —
// на відміну від lucide-react-native, який тут навмисно НЕ використовується:
// одноколірний контур не передає такі концепти (шапка випускника, книга)
// так само впізнавано, як справжня багатоколірна ілюстрація. Правило
// зафіксоване в ways-of-working.md: Lucide — для навігації/відгуку,
// Twemoji — для ілюстрації смислу.
//
// `size` — ОДНАКОВИЙ для всіх плиток (не підбирається під конкретну іконку,
// інакше пропорції плиток розʼїдуться між собою). Всі 5 гліфів — власного
// кольору (Twemoji), currentColor ніде не використовується — tint-пропа
// немає навмисно, не додавай його без нового currentColor-гліфа.
export function TileEmoji({ name, size = 34 }: { name: TileEmojiName; size?: number }) {
  return <SvgXml xml={TILE_EMOJI[name]} width={size} height={size} />;
}
