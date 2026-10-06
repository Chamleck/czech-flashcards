import type { CzechCase, NounEntry } from "../types";
import { NOUNS } from "./nouns";
import { ADJECTIVES } from "./adjectives";
import { cardinalByValue, cardinalForms } from "../utils/numeralForms";
import { firstForm } from "../utils/quizCommon";

// ─────────────────────────── ЧАС ДОБИ ───────────────────────────
// Дві повністю різні системи називання часу (звірено з czechonline.org
// [академ.], mozaika.eu — таблиця «Kolik je hodin?» (2022), forendors.cz, blog.mclemon.org):
//
// 1) ФОРМАЛЬНА / 24-год — офіційний контекст (розклади, ТБ, вокзал):
//    просто «година хвилина» без слова hodina: 15:20 → «patnáct dvacet».
//
// 2) РОЗМОВНА / 12-год — побутова, все відлічується ВПЕРЕД до наступної години:
//    • čtvrt na + ЗНАХІДНИЙ кількісного жін. роду наступної години:
//        1:15 → «čtvrt na dvě» (чверть на другу)
//    • půl + РОДОВИЙ порядкового жін. роду наступної години:
//        1:30 → «půl druhé» — АЛЕ виняток: 12:30 → «půl jedné» (не «půl první»!)
//    • tři čtvrtě na + ЗНАХІДНИЙ кількісного жін. наступної години:
//        1:45 → «tři čtvrtě na dvě»
//    • проміжні 5-хвилинки — «za X minut <наступна опорна точка>»:
//        1:25 → «za pět minut půl druhé» (за 5 хв пів другої); перед цілою годиною — БЕЗ hodiny:
//        1:55 → «za pět minut dvě» (mozaika.eu: «hodina / hodiny / hodin» лише там, де в таблиці вони в дужках)
//
// УВАГА: čtvrt/tři čtvrtě беруть кількісне (jednu, dvě, tři…),
// а půl бере ПОРЯДКОВЕ (jedné, druhé, třetí…) — це різні числівники!
//
// Числівники й слова hodina / minuta НЕ дублюються тут рядками: форми беремо зі словника — кількісні з
// data/cardinals.ts (за value), порядкові з data/adjectives.ts (category ordinal, за value), hodina / minuta з
// data/nouns.ts. Тут лише правила читання.
//
// Складені години 21–23 (і хвилини 21–59): десяток + одиниця у формі для диктування — «dvacet jedna», «dvacet dva»
// (IJP, heslo dvaadvacet: «podoby dvacet dva, dvacet dvě užíváme při diktování číslic»; приклад «dvacet dva let»), іменник —
// родовий множини: «Je dvacet jedna hodin» (mozaika.eu), «dvacet dva hodin».
//
// ПРАВИЛА ДОДАВАННЯ (квіз «Дата й час»)
//  1. Нових слів тут немає: числівник, порядковий чи іменник додається у своєму файлі (поле value / id нижче).
//  2. DAY_PARTS — частини доби: from — перша година частини (межі розмиті, ÚJČ; таблиця збігається з темою граматики
//     «Дата й час»), quizHours — години, які квіз питає: лише з середини частини, подалі від межі (там спірно).
//     Дистрактор квізу — лише НЕсуміжна частина (сусідню носії інколи вживають: «v jedenáct večer», «ve tři ráno»).
//  3. Перед здачею — оракул scripts/check-quiz-coverage.ts --only=datetime: «Помилок: 0».

// Слова словника, з яких складається читання часу (посилання на дані, як aspectPairId).
const HOUR_NOUN_ID = "hodina";
const MINUTE_NOUN_ID = "minuta";

function nounById(id: string): NounEntry {
  const n = NOUNS.find((x) => x.id === id);
  if (!n) throw new Error(`timeforms: немає іменника ${id}`);
  return n;
}
const HOUR = nounById(HOUR_NOUN_ID);
const MINUTE = nounById(MINUTE_NOUN_ID);

// Кількісне жін. роду у відмінку c (jedna / jednu / jedné, dvě, pět…), 1–19 і круглі десятки.
function cardinalFem(v: number, c: CzechCase): string {
  const card = cardinalByValue(v);
  if (!card) throw new Error(`timeforms: немає числівника ${v}`);
  return cardinalForms(card, c, "fem")[0];
}

// Порядкове жін. роду в родовому (druhé, třetí…) — для «půl».
function ordinalFemGen(v: number): string {
  const ord = ADJECTIVES.find((a) => a.category === "ordinal" && a.value === v);
  if (!ord) throw new Error(`timeforms: немає порядкового ${v}`);
  return firstForm(ord.declension.fem.genitiv.sg);
}

// Число як просте перелічування (1–59): «patnáct», «dvacet jedna», «dvacet dva», «padesát pět».
function plainNumber(n: number): string {
  if (n < 20 || n % 10 === 0) return cardinalFem(n, "nominativ");
  const unit = cardinalByValue(n % 10)!;
  // одиниця у формі для диктування: jedna (жін.), далі dva, tři… (чол.)
  const unitForm = cardinalForms(unit, "nominativ", n % 10 === 1 ? "fem" : "masc_inan")[0];
  return `${cardinalFem(n - (n % 10), "nominativ")} ${unitForm}`;
}

// «Число + іменник» у відмінку c (називний / знахідний): 1 → однина того ж відмінка (jedna hodina, jednu hodinu),
// 2–4 → множина того ж відмінка (dvě hodiny), 5+ і складені → родовий множини (pět hodin, dvacet jedna hodin).
function counted(noun: NounEntry, n: number, c: "nominativ" | "akuzativ"): string {
  const num = n < 20 ? cardinalFem(n, c) : plainNumber(n);
  const form = n === 1 ? noun.declension[c].sg : n >= 2 && n <= 4 ? noun.declension[c].pl : noun.declension.genitiv.pl;
  return `${num} ${firstForm(form)}`;
}

// Чи узгоджується «Je / Jsou» з множиною: лише «2–4 + називний множини» (Jsou dvě hodiny); решта — Je.
const plural24 = (n: number) => n >= 2 && n <= 4;

// ─────────────── Частина доби (ранок/день/вечір/ніч) ───────────────
// Розмовний час часто уточнюють частиною доби, якщо не ясно з контексту:
// «v půl druhé ráno» (пів другої РАНКУ) проти «v půl druhé odpoledne» (ДНЯ).
// Джерело: czechonline.org (g-11-hodiny.pdf) — явно описує це як окремий
// стандартний спосіб; Naše řeč (ÚJČ) — корпусні межі «večer» 18–22 з піком ~20.
interface DayPart {
  phrase: string; // уточнення після часу
  from: number; // перша година частини (0–23), до from наступної частини
  quizHours: number[]; // години, які питає квіз (середина частини, правило 2)
}
export const DAY_PARTS: DayPart[] = [
  { phrase: "ráno", from: 6, quizHours: [7, 8] },
  { phrase: "dopoledne", from: 9, quizHours: [10, 11] },
  { phrase: "odpoledne", from: 12, quizHours: [13, 14, 15, 16] },
  { phrase: "večer", from: 18, quizHours: [19, 20, 21] },
  { phrase: "v noci", from: 22, quizHours: [23, 1, 2, 3] }, // 0 — «dvanáct v noci» / půlnoc, не питаємо
];

// Частина доби для години (DAY_PARTS — за зростанням from; ніч 22–6 переходить через північ).
export function dayPartOf(h24: number): DayPart {
  let best = DAY_PARTS[DAY_PARTS.length - 1]; // до першої межі (0–5) — ще ніч
  for (const p of DAY_PARTS) if (h24 >= p.from) best = p;
  return best;
}

// Частини, не суміжні з даною (у циклі): лише вони годяться як дистрактор (правило 2).
export function nonAdjacentParts(p: DayPart): DayPart[] {
  const n = DAY_PARTS.length;
  const i = DAY_PARTS.indexOf(p);
  return DAY_PARTS.filter((_, j) => j !== i && j !== (i + 1) % n && j !== (i + n - 1) % n);
}

export interface TimePoint {
  h24: number; // 0..23
  m: number; // 0..59
}

// ─────────────── Формальна 24-год ───────────────
// «patnáct dvacet» (15:20; mozaika.eu: «Je jedna dvacet»). Ціла година — зі словом hodina: «Je sedmnáct hodin».
// Мінути 1–9 — «sedmnáct hodin pět minut» (mozaika.eu); для годин 1–4 так узгоджене читання («dvě hodiny pět minut»,
// Je чи Jsou?) у джерелі не трапляється — null, квіз не питає. Година 0 — у джерелі лише розмовне (půl jedné,
// čtvrt na jednu) і «půlnoc» — null.
function formal24(tp: TimePoint): string | null {
  if (tp.h24 === 0) return null;
  if (tp.m === 0) return counted(HOUR, tp.h24, "nominativ");
  if (tp.m < 10) return tp.h24 < 5 ? null : `${counted(HOUR, tp.h24, "nominativ")} ${counted(MINUTE, tp.m, "nominativ")}`;
  return `${plainNumber(tp.h24)} ${plainNumber(tp.m)}`;
}

// ─────────────── Розмовна 12-год ───────────────
const h12of = (h24: number) => (h24 % 12 === 0 ? 12 : h24 % 12);
const nextHour12 = (h12: number) => (h12 === 12 ? 1 : h12 + 1);

// «půl» + наступна година: родовий жін. порядкового, але 1 → «jedné» (родовий жін. кількісного jedna).
const halfPast = (nh: number) => `půl ${nh === 1 ? cardinalFem(1, "genitiv") : ordinalFemGen(nh)}`;

// Опорні точки розмовної системи для години h12 у відмінку c (ціла година — у c, решта однакова в обох).
function anchors(h12: number, c: "nominativ" | "akuzativ"): Record<number, string> {
  const nh = nextHour12(h12);
  return {
    0: counted(HOUR, h12, c),
    15: `čtvrt na ${cardinalFem(nh, "akuzativ")}`,
    30: halfPast(nh),
    45: `tři čtvrtě na ${cardinalFem(nh, "akuzativ")}`,
    60: cardinalFem(nh, "nominativ"), // лише після «za X minut»: «za pět minut dvě» — без hodiny (mozaika.eu)
  };
}

// Розмовна фраза без «Je / Jsou»; null — хвилини не кратні 5.
export function colloquial12(tp: TimePoint): string | null {
  const a = anchors(h12of(tp.h24), "nominativ");
  if (tp.m in a && tp.m !== 60) return a[tp.m];
  // Проміжні 5-хвилинки: «za X minut <наступна опорна точка>» (лише 5 або 10 хв до неї).
  for (const at of [15, 30, 45, 60]) {
    const diff = at - tp.m;
    if (diff === 5 || diff === 10) return `za ${counted(MINUTE, diff, "akuzativ")} ${a[at]}`;
  }
  return null;
}

// «V kolik?» — час після «v / ve» (знахідний): «jednu hodinu», «dvě hodiny», «půl druhé», «čtvrt na tři»,
// «tři čtvrtě na sedm». Лише цілі години, чверті й пів (з «za pět minut…» прийменника v немає); інакше null.
export function colloquialAt(tp: TimePoint): string | null {
  if (tp.m % 15 !== 0) return null;
  return anchors(h12of(tp.h24), "akuzativ")[tp.m];
}

// Повне речення «Je … / Jsou …» для формальної чи розмовної системи; null — читання немає.
export function timeSentence(tp: TimePoint, sys: "formal" | "colloquial"): string | null {
  const raw = sys === "formal" ? formal24(tp) : colloquial12(tp);
  if (!raw) return null;
  const wholeHour = sys === "formal" ? tp.h24 : h12of(tp.h24);
  return `${tp.m === 0 && plural24(wholeHour) ? "Jsou" : "Je"} ${raw}`;
}
