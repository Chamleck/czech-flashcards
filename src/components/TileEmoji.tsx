import React from "react";
import { SvgXml } from "react-native-svg";
import { TILE_EMOJI, TileEmojiName } from "./icons/tileEmoji";

// Декоративна іконка змісту плитки (Fluent Emoji Flat/High Contrast чи
// Twemoji залежно від конкретного гліфа — див. icons/tileEmoji.ts) —
// на відміну від Phosphor, який тут навмисно НЕ використовується: одноколірний
// duotone/bold-контур не передає такі концепти (вогонь, кубок, книга) так само
// впізнавано, як справжня багатоколірна ілюстрація. Правило зафіксоване в
// ways-of-working.md: Phosphor — для навігації/відгуку, Fluent Emoji —
// для ілюстрації смислу.
//
// `size` — ОДНАКОВИЙ для всіх плиток (не підбирається під конкретну іконку,
// інакше пропорції плиток розʼїдуться між собою).
//
// `tint` — лише для currentColor-варіантів (наразі graduationCap, High
// Contrast): яким кольором малювати. Для власноколірних гліфів (openBook,
// bullseye, speechBalloon, writingHand) проп ігнорується — там колір уже
// «зашитий» у самих path.
export function TileEmoji({ name, size = 34, tint }: { name: TileEmojiName; size?: number; tint?: string }) {
  return <SvgXml xml={TILE_EMOJI[name]} width={size} height={size} color={tint} />;
}
