import type { CardinalEntry, CzechCase, Gender } from "../types";
import { CARDINALS } from "../data/cardinals";
import { splitForms } from "./quizCommon";

// ─────────────── Форми кількісних числівників (спільне: квіз «Числівники», читання часу в data/timeforms.ts) ───────────────

export const isDirect = (c: CzechCase) => c === "nominativ" || c === "akuzativ";
const isMasc = (g: Gender) => g === "masc_anim" || g === "masc_inan";

// Форма простого числівника для іменника роду g (усі дублети).
export function cardinalForms(card: CardinalEntry, c: CzechCase, g: Gender): string[] {
  switch (card.kind) {
    case "gendered":
      return splitForms(card.declension[g][c].sg);
    case "twoForm":
      return splitForms(card.forms[c][isMasc(g) ? "masc" : "femNeut"]);
    case "invariantDecl":
      return splitForms(card.forms[c]);
    case "oblique":
      return isDirect(c) ? [card.direct] : splitForms(card.oblique);
  }
}

// Числівник за значенням (поле value у data/cardinals.ts); undefined — такого слова немає (21–99 складені).
export function cardinalByValue(v: number): CardinalEntry | undefined {
  return CARDINALS.find((c) => c.value === v);
}
