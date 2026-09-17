import React from "react";
import { SvgXml } from "react-native-svg";
import { TILE_EMOJI, TileEmojiName } from "./icons/tileEmoji";

// Декоративна іконка змісту плитки (Fluent Emoji Flat, багатоколірна) —
// на відміну від Phosphor, який тут навмисно НЕ використовується: одноколірний
// duotone/bold-контур не передає такі концепти (вогонь, кубок, книга) так само
// впізнавано, як справжня багатоколірна ілюстрація. Правило зафіксоване в
// ways-of-working.md: Phosphor — для навігації/відгуку, Fluent Emoji — для
// ілюстрації смислу.
export function TileEmoji({ name, size = 30 }: { name: TileEmojiName; size?: number }) {
  return <SvgXml xml={TILE_EMOJI[name]} width={size} height={size} />;
}
