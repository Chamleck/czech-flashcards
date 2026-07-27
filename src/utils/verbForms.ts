import { VerbEntry, VerbPerson, PERSON_ORDER } from "../types";
import { BYT_FUTURE, PAST_AUX } from "../data/auxVerbs";

// ─────────────────────────────────────────────────────────────
// Єдине місце побудови фінітних форм дієслова з правильним порядком
// зворотної клітики se/si. Використовується і карткою розкриття
// (VerbConjugation), і движком квізу (verbFlashcardEngine), щоб логіка
// порядку слів не дублювалась.
// ─────────────────────────────────────────────────────────────

// Рід/число підмета для минулого часу впливає на форму дієприкметника.
// on = чол. однина, ona = жін. однина, ono = сер. однина,
// oni_manim = чол. істот. множини, oni_other = решта множини.
export type PastSubject = "ja" | "ty" | "on" | "ona" | "ono" | "my" | "vy" | "oni_manim" | "oni_other";

export const PAST_SUBJECT_ORDER: PastSubject[] = [
  "ja",
  "ty",
  "on",
  "ona",
  "ono",
  "my",
  "vy",
  "oni_manim",
  "oni_other",
];

// Підписи підметів минулого часу (займенник cz + укр).
export const PAST_SUBJECT_LABELS: Record<PastSubject, { cz: string; uk: string }> = {
  ja: { cz: "já", uk: "я" },
  ty: { cz: "ty", uk: "ти" },
  on: { cz: "on", uk: "він" },
  ona: { cz: "ona", uk: "вона" },
  ono: { cz: "ono", uk: "воно" },
  my: { cz: "my", uk: "ми" },
  vy: { cz: "vy", uk: "ви" },
  oni_manim: { cz: "oni", uk: "вони (чол. істот.)" },
  oni_other: { cz: "ony", uk: "вони (решта)" },
};

// Яку особу допоміжного дієслова "být" використовує підмет минулого часу.
function auxPersonFor(s: PastSubject): VerbPerson {
  switch (s) {
    case "ja":
      return "ja";
    case "ty":
      return "ty";
    case "my":
      return "my";
    case "vy":
      return "vy";
    // 3-тя особа (on/ona/ono/oni*) — допоміжного немає
    default:
      return "on";
  }
}

// Яку форму l-дієприкметника бере підмет.
function participleFor(v: VerbEntry, s: PastSubject): string {
  const pp = v.pastParticiple;
  switch (s) {
    case "ja":
    case "ty":
    case "on":
      return pp.m;
    case "ona":
      return pp.f;
    case "ono":
      return pp.n;
    case "my":
    case "vy":
    case "oni_manim":
      return pp.manim_pl;
    case "oni_other":
      return pp.other_pl;
  }
}

// Теперішній час для особи (тільки недоконані мають present).
// se/si одразу після дієслова: "učím se".
export function presentForm(v: VerbEntry, p: VerbPerson): string | null {
  if (!v.present) return null;
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  return `${v.present[p]}${refl}`;
}

// Майбутній час для особи.
//  - власні форми (доконані, jít→půjdu): se/si одразу після — "vrátím se";
//  - складене недоконаних: "budu se učit" (se після budu, не після інфінітива).
export function futureForm(v: VerbEntry, p: VerbPerson): string {
  if (v.future) {
    const refl = v.reflexive ? ` ${v.reflexive}` : "";
    return `${v.future[p]}${refl}`;
  }
  const refl = v.reflexive ? `${v.reflexive} ` : "";
  return `${BYT_FUTURE[p]} ${refl}${v.cz}`;
}

// Минулий час для підмета: [дієприкметник] [допоміжне] se ("učil jsem se").
// У 3-й особі допоміжного немає: "učil se".
export function pastForm(v: VerbEntry, s: PastSubject): string {
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  const participle = participleFor(v, s);
  const auxP = auxPersonFor(s);
  const aux = auxP === "on" ? "" : PAST_AUX[auxP]; // 3-тя особа → без допоміжного
  return aux ? `${participle} ${aux}${refl}` : `${participle}${refl}`;
}

// Зручний доступ до 6 стандартних осіб для теп./майб. таблиць.
export { PERSON_ORDER };
