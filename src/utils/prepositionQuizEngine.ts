import { CzechCase, NounEntry, PrepositionEntry, CASE_LABELS, GrammaticalNumber } from "../types";
import { PREPOSITIONS } from "../data/prepositions";
import { NOUNS } from "../data/nouns";
import { nounUsableAsPartner } from "../data/categories";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// ─────────────────────────── Квіз «Прийменники» ───────────────────────────
// Одна категорія «Флеш-картки», кілька механік (як «Числівники» / «Час і дата»):
//   • fixed-noun     — прийменник видно, обери ФОРМУ іменника-партнера (відмінок,
//                      яким керує прийменник). Дистрактор — інший відмінок партнера.
//   • fixed-prep     — переклад видно, обери сам ПРИЙМЕННИК. Дистрактор — «сусід
//                      по відмінку» (той самий відмінок, інше значення) з усіх 29.
//   • dual           — прийменник видно + taskText явно каже РУХ чи СПОКІЙ; обери
//                      форму партнера у правильному з двох відмінків. Дистрактор —
//                      той самий партнер в ІНШОМУ з двох відмінків (плутанина рух/спокій).
//   • za-exchange    — «za» у сенсі обмін/ціна (знахідний); окремі питання.
//
// Контракт питання — спільний із рештою рушіїв: рівно [correct, distractor],
// comboId = id комбо в пулі НАПРЯМУ (безпечний патерн verb/declension рушіїв,
// не перерахунок — саме перерахунок ламав ваги в numeral).

export interface PrepQuestion {
  comboId: string;
  promptWord: string; // заголовок: сам прийменник (fixed-noun/dual/za) або укр. переклад (fixed-prep)
  promptUk: string; // переклад тестованого; для fixed-prep порожній (відповідь — прийменник)
  promptLabel: string; // підпис над заголовком
  taskText: string;
  contextPhrase: string; // фраза з пропуском
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstForm(s: string): string {
  return s.split(" / ")[0];
}

function collapseVowelLength(s: string): string {
  return s
    .replace(/á/g, "a").replace(/í/g, "i").replace(/é/g, "e").replace(/ó/g, "o")
    .replace(/ú/g, "u").replace(/ů/g, "u").replace(/ý/g, "y").toLowerCase();
}

function isUsable(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// Вокалізація прийменника перед словом-партнером (лише безвиняткові випадки).
function vocalize(prep: string, vocalized: string | undefined, next: string): string {
  if (!vocalized) return prep;
  const n = next.toLowerCase();
  if (prep === "k" && /^[kg]/.test(n)) return vocalized;
  if (prep === "s" && /^[szšž]/.test(n)) return vocalized;
  if (prep === "z" && /^[szšž]/.test(n)) return vocalized;
  if (prep === "v" && /^[fv]/.test(n)) return vocalized;
  return prep;
}

const CASES: CzechCase[] = ["nominativ", "genitiv", "dativ", "akuzativ", "lokal", "instrumental"];

// Партнер-пул: ті самі фільтри, що в numeral (не декоративні категорії).
// Незлічувані лишаємо — для прийменників «bez másla» цілком нормально (на відміну
// від «osm mas» у числівниках), тому НЕ виключаємо uncountable.
const PARTNER_POOL = NOUNS.filter((n) => nounUsableAsPartner(n.category));

function randomPartner(): NounEntry {
  return PARTNER_POOL[Math.floor(Math.random() * PARTNER_POOL.length)];
}

// Форма партнера в заданому відмінку (однина — прийменникові фрази зазвичай sg).
function partnerForm(noun: NounEntry, c: CzechCase): string {
  return firstForm(noun.declension[c].sg);
}

// Форма партнера в заданому відмінку І числі (для «mezi» потрібна множина).
function partnerFormN(noun: NounEntry, c: CzechCase, n: GrammaticalNumber): string {
  return firstForm(noun.declension[c][n]);
}

// Дистрактор у тому ж числі: той самий партнер в іншому з двох відмінків (dual).
function nounDistractorN(
  noun: NounEntry,
  correctCase: CzechCase,
  n: GrammaticalNumber,
  correct: string,
  preferCase: CzechCase
): string | null {
  const f = partnerFormN(noun, preferCase, n);
  if (isUsable(correct, f)) return f;
  for (const cc of shuffle(CASES.filter((c) => c !== correctCase && c !== "vokativ"))) {
    const alt = partnerFormN(noun, cc, n);
    if (isUsable(correct, alt)) return alt;
  }
  return null;
}

// Дистрактор-іменник: той самий партнер в ІНШОМУ відмінку (для dual — конкретно
// в «іншому з двох», передається preferCase; інакше — будь-який інший робочий).
function nounDistractor(noun: NounEntry, correctCase: CzechCase, correct: string, preferCase?: CzechCase): string | null {
  if (preferCase) {
    const f = partnerForm(noun, preferCase);
    if (isUsable(correct, f)) return f;
  }
  for (const cc of shuffle(CASES.filter((c) => c !== correctCase && c !== "vokativ"))) {
    const f = partnerForm(noun, cc);
    if (isUsable(correct, f)) return f;
  }
  return null;
}

// ─────────────── Підтип fixed-noun ───────────────
function buildFixedNoun(prep: PrepositionEntry): PrepQuestion | null {
  const c = prep.govCase;
  const noun = randomPartner();
  const correct = partnerForm(noun, c);
  const distractor = nounDistractor(noun, c, correct);
  if (!isUsable(correct, distractor)) return null;

  const lbl = CASE_LABELS[c];
  const prepShown = vocalize(prep.cz, prep.vocalized, correct);
  return {
    comboId: comboId(prep.id, "fixnoun", c),
    promptWord: prep.cz,
    promptUk: prep.uk,
    promptLabel: "прийменник 🇨🇿",
    taskText: `Оберіть форму іменника після «${prep.cz}»: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`,
    contextPhrase: `${prepShown} ___`,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підтип fixed-prep ───────────────
// Дистрактор — інший прийменник ТОГО САМОГО відмінка (з усіх 29: fixed за govCase,
// dual за релевантним сенсом), щоб тестувати значення, а не вгадування за формою.
function prepsGoverning(c: CzechCase, exceptId: string): PrepositionEntry[] {
  const out: PrepositionEntry[] = [];
  for (const p of PREPOSITIONS) {
    if (p.id === exceptId) continue;
    if (p.type === "fixed") {
      if (p.govCase === c) out.push(p);
    } else if (p.dual) {
      if (p.dual.motion.govCase === c || p.dual.location.govCase === c) out.push(p);
    }
  }
  return out;
}

function buildFixedPrep(prep: PrepositionEntry): PrepQuestion | null {
  const c = prep.govCase;
  const neighbors = prepsGoverning(c, prep.id);
  if (neighbors.length === 0) return null;
  const distractorPrep = neighbors[Math.floor(Math.random() * neighbors.length)];
  const noun = randomPartner();
  const correctForm = partnerForm(noun, c);

  const correct = prep.cz;
  const distractor = distractorPrep.cz;
  if (correct === distractor) return null;

  const lbl = CASE_LABELS[c];
  return {
    comboId: comboId(prep.id, "fixprep", c),
    promptWord: prep.uk,
    promptUk: "",
    promptLabel: "українською 🇺🇦 — оберіть прийменник",
    taskText: `Який прийменник підходить за змістом? Керує відмінком ${lbl.uk} (${lbl.cz}).`,
    contextPhrase: `___ ${correctForm}`,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підтип dual (рух/спокій) ───────────────
type DualSense = "motion" | "location";

// Фрейми під квіз для КОЖНОГО з 9 дуальних прийменників окремо (не один спільний
// на всі — узькі значення o/po/v не узагальнюються довільним дієсловом). Виведені
// з уже звірених прикладів у prepositions.ts: беремо дієслівну частину, іменник
// замінюємо на пропуск. По 2 фрейми на сенс для різноманітності. Партнер
// підставляється генеративно з PARTNER_POOL — словник іменників так само
// продовжить розширювати варіативність (той самий патерн, що adj-pron/numeral).
// "{p}" — місце прийменника (з урахуванням вокалізації), "___" — пропуск партнера.
const DUAL_FRAMES: Record<string, { motion: string[]; location: string[] }> = {
  "prep-na": {
    motion: ["Jdu {p} ___", "Polož to {p} ___", "Čekám {p} ___"],
    location: ["Jsem {p} ___", "Kniha leží {p} ___", "Sedím {p} ___"],
  },
  "prep-o": {
    motion: ["Opřel to {p} ___", "Zakopl {p} ___", "Požádal {p} ___"],
    location: ["Mluvíme {p} ___", "Přemýšlím {p} ___", "Vím {p} ___"],
  },
  "prep-po": {
    motion: ["Voda sahá {p} ___", "Čekej {p} ___", "Bylo mu to {p} ___"],
    location: ["Chodím {p} ___", "Přijdu {p} ___", "Šel {p} ___"],
  },
  "prep-v": {
    motion: ["Věřím {p} ___", "Proměnil se {p} ___", "Doufám {p} ___"],
    location: ["Jsem {p} ___", "Bydlím {p} ___", "Pracuji {p} ___"],
  },
  "prep-nad": {
    motion: ["Pověsil to {p} ___", "Vzlétl {p} ___", "Přišel {p} ___"],
    location: ["Obraz visí {p} ___", "Slunce je {p} ___", "Bydlím {p} ___"],
  },
  "prep-pod": {
    motion: ["Dal to {p} ___", "Vlezl {p} ___", "Přišel {p} ___"],
    location: ["Boty jsou {p} ___", "Spí {p} ___", "Najdeš to {p} ___"],
  },
  "prep-pred": {
    motion: ["Postavil to {p} ___", "Předstoupil {p} ___", "Přišel {p} ___"],
    location: ["Auto stojí {p} ___", "Čekám {p} ___", "Zaparkoval {p} ___"],
  },
  "prep-za": {
    motion: ["Schoval se {p} ___", "Zašel {p} ___", "Přišel {p} ___"],
    location: ["Stojí {p} ___", "Zahrada je {p} ___", "Bydlí {p} ___"],
  },
  "prep-mezi": {
    motion: ["Sedl si {p} ___", "Vložil to {p} ___", "Přišel {p} ___"],
    location: ["Sedí {p} ___", "Je to {p} ___", "Bydlím {p} ___"],
  },
};

function buildDual(prep: PrepositionEntry, sense: DualSense): PrepQuestion | null {
  if (!prep.dual) return null;
  const senseData = sense === "motion" ? prep.dual.motion : prep.dual.location;
  const otherData = sense === "motion" ? prep.dual.location : prep.dual.motion;
  const c = senseData.govCase;
  const otherCase = otherData.govCase;

  // «mezi» семантично вимагає МНОЖИНИ партнера («між будинками», не «між
  // будинком») — єдиний виняток з 9; решта беруть однину.
  const num: GrammaticalNumber = prep.cz === "mezi" ? "pl" : "sg";

  const noun = randomPartner();
  const correct = partnerFormN(noun, c, num);
  // Дистрактор — той самий партнер у ТОМУ Ж числі, але в ІНШОМУ з двох відмінків.
  const distractor = nounDistractorN(noun, c, num, correct, otherCase);
  if (!isUsable(correct, distractor)) return null;

  const lbl = CASE_LABELS[c];
  const prepShown = vocalize(prep.cz, prep.vocalized, correct);
  const frames = DUAL_FRAMES[prep.id]?.[sense] ?? ["{p} ___"];
  const frame = frames[Math.floor(Math.random() * frames.length)];
  const contextPhrase = frame.replace("{p}", prepShown);
  const senseUk = sense === "motion" ? "рух — куди?" : "спокій — де?";
  return {
    comboId: comboId(prep.id, `dual-${sense}`, c),
    promptWord: prep.cz,
    promptUk: prep.uk,
    promptLabel: "прийменник 🇨🇿",
    taskText: `«${prep.cz}» — ${senseUk} Оберіть форму: ${lbl.uk} (${lbl.cz}).`,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підтип za-exchange ───────────────
function buildZaExchange(prep: PrepositionEntry): PrepQuestion | null {
  if (!prep.dual?.exchange) return null;
  const c = prep.dual.exchange.govCase; // akuzativ
  const noun = randomPartner();
  const correct = partnerForm(noun, c);
  const distractor = nounDistractor(noun, c, correct);
  if (!isUsable(correct, distractor)) return null;

  const lbl = CASE_LABELS[c];
  return {
    comboId: comboId(prep.id, "za-exchange", c),
    promptWord: prep.cz,
    promptUk: "за (обмін / ціна)",
    promptLabel: "прийменник 🇨🇿",
    taskText: `«za» — обмін / ціна (скільки заплатив). Оберіть форму: ${lbl.uk} (${lbl.cz}).`,
    contextPhrase: `Zaplatil jsem za ___`,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Пул комбінацій ───────────────
type PrepKind = "fixnoun" | "fixprep" | "dual" | "exchange";

interface Combo {
  id: string;
  wordId: string;
  kind: PrepKind;
  make: () => PrepQuestion | null;
}

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") {
      combos.push({
        id: comboId(p.id, "fixnoun", p.govCase),
        wordId: p.id,
        kind: "fixnoun",
        make: () => buildFixedNoun(p),
      });
      // fixed-prep лише якщо є «сусід по відмінку» (інакше немає дистрактора)
      if (prepsGoverning(p.govCase, p.id).length > 0) {
        combos.push({
          id: comboId(p.id, "fixprep", p.govCase),
          wordId: p.id,
          kind: "fixprep",
          make: () => buildFixedPrep(p),
        });
      }
    } else if (p.dual) {
      for (const sense of ["motion", "location"] as DualSense[]) {
        const sd = sense === "motion" ? p.dual.motion : p.dual.location;
        combos.push({
          id: comboId(p.id, `dual-${sense}`, sd.govCase),
          wordId: p.id,
          kind: "dual",
          make: () => buildDual(p, sense),
        });
      }
      if (p.dual.exchange) {
        combos.push({
          id: comboId(p.id, "za-exchange", p.dual.exchange.govCase),
          wordId: p.id,
          kind: "exchange",
          make: () => buildZaExchange(p),
        });
      }
    }
  }
  return combos;
}

// Квота: fixprep і exchange — менші/специфічні пули, гарантуємо їм присутність,
// щоб пропорційний вибір не витіснив (той самий підхід, що в datetime/adj-pron).
const PREP_KIND_QUOTA: KindQuota<PrepKind> = {
  kindOf: (c) => (c as Combo).kind,
  minSlots: { fixnoun: 4, fixprep: 3, dual: 3, exchange: 1 },
};

export function generatePrepositionSession(
  count: number,
  pool: Combo[] = enumerateCombos(),
  mistakes: MistakeStore = {}
): PrepQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId, undefined, PREP_KIND_QUOTA);
  const questions: PrepQuestion[] = [];
  for (const c of chosen) {
    const q = c.make();
    if (q) questions.push(q);
  }
  // Добір, якщо якісь make() повернули null (дистрактор збігся).
  if (questions.length < count) {
    for (const c of shuffle(pool)) {
      if (questions.length >= count) break;
      const q = c.make();
      if (q && !questions.some((x) => x.comboId === q.comboId)) questions.push(q);
    }
  }
  return questions;
}
