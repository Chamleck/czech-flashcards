import React from "react";
import { ClickableWord, AppNav } from "./ClickableWord";
import { NoteLink } from "../types";

// Розрізає note на текст + ClickableWord-сегменти за списком LITERAL
// підрядків (noteLinks) — той самий принцип, що aspectPairNote у
// VerbConjugation.tsx: ціль кліку ЗАВЖДИ структурне поле (wordId), пошук
// підрядка лише вирішує ДЕ його підкреслити в тексті. На відміну від
// aspectPairNote тут немає ОДНОГО фіксованого шаблону фрази на всі нотатки
// (кожна службова пара сформульована по-своєму), тому замість регулярки —
// явний список {word, wordId, kind} прямо в даних слова.
//
// Кожен link шукається як ПЕРШЕ входження свого word у note (indexOf, зліва
// направо); якщо word не знайдено — цей один лінк тихо пропускається, решта
// тексту лишається звичайним. Без navigation чи без жодного лінка — просто
// повертає note як є (без жодної зміни поведінки для решти карток).
export function renderNoteWithLinks(
  note: string,
  noteLinks: NoteLink[] | undefined,
  navigation: AppNav | undefined,
  linkMode: "push" | "replace" | undefined
): React.ReactNode {
  if (!navigation || !noteLinks || noteLinks.length === 0) return note;

  const found = noteLinks
    .map((l) => ({ ...l, index: note.indexOf(l.word) }))
    .filter((l) => l.index !== -1)
    .sort((a, b) => a.index - b.index);
  if (found.length === 0) return note;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  found.forEach((l, i) => {
    if (l.index < cursor) return; // перекриття з попереднім лінком — пропускаємо
    parts.push(note.slice(cursor, l.index));
    parts.push(
      <ClickableWord key={i} word={l.word} wordId={l.wordId} kind={l.kind} navigation={navigation} mode={linkMode} />
    );
    cursor = l.index + l.word.length;
  });
  parts.push(note.slice(cursor));
  return <>{parts}</>;
}
