import React from "react";
import { SvgXml } from "react-native-svg";
import { POS_EMOJI, PosEmojiName } from "./icons/posEmoji";

// Декоративна іконка частини мови — Twemoji, див. icons/posEmoji.ts.
// Окремий від TileEmoji (Home) компонент і окремий набір гліфів: різні
// концепти (частини мови проти категорій Home), різні розміри в різних
// контекстах цього ж екрана (сітка тайлів — 34, рядок результатів пошуку
// — 22), тож розмір тут явний параметр, а не фіксований дефолт для одного
// місця використання. Власного кольору Twemoji-гліфи — currentColor не
// застосовується, tint-пропа немає навмисно, як і в TileEmoji.
export function PosEmoji({ name, size }: { name: PosEmojiName; size: number }) {
  return <SvgXml xml={POS_EMOJI[name]} width={size} height={size} />;
}
