import { CzechCase, NounEntry, PrepositionEntry, CASE_LABELS, GrammaticalNumber } from "../types";
import { PREPOSITIONS } from "../data/prepositions";
import { NOUNS } from "../data/nouns";
import { nounUsableAsPartner } from "../data/categories";
import { validateNounSem } from "../data/nounTags";
import { CONFUSABLE_PREP_PAIRS, DUAL_FRAMES, DualFrame, EXCHANGE_FRAMES, FIXED_EXCLUDE, FIXED_NEEDS, Needs } from "../data/prepositionPartners";
import { acceptedForms, candidateNumbers, disjoint, formOf, matchesNeeds, vocalizedPrep } from "./partnerSelection";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// ─────────────────────────── Квіз «Прийменники» ───────────────────────────
// Одна категорія «Флеш-картки», кілька механік (як «Числівники» / «Час і дата»):
//   • fixed-noun     — прийменник видно, обери ФОРМУ іменника-партнера (відмінок, яким керує прийменник).
//   • fixed-prep     — переклад видно, обери сам ПРИЙМЕННИК. Дистрактор — «сусід по відмінку» з іншим значенням.
//   • dual           — прийменник видно + taskText каже НАПРЯМОК/ЦІЛЬ чи СПОКІЙ; обери форму партнера у правильному з
//                      двох відмінків. Дистрактор — той самий партнер в ІНШОМУ з двох відмінків.
//   • za-exchange    — «za» у сенсі обмін/ціна (знахідний).
//
// ПАРТНЕР (іменник у фразі) підбирається за СМИСЛОВИМИ ТЕГАМИ (data/nounTags.ts), а не навмання з усього
// словника: фрази природні («Jsem v škole», «Jdu na poštu», «Polož to na stůl»), а новий іменник з правильними
// тегами потрапляє в усі підхожі фрази автоматично. Вимоги фреймів — data/prepositionPartners.ts.
//
// Гарантії кожного питання (перевіряє dev-прогін, див. validate нижче):
//   1. правильна відповідь і дистрактор — різні форми, жодна прийнятна форма правильної клітинки (дублети,
//      variants) не стоїть серед дистракторів;
//   2. вокалізація прийменника (ve/ke/se/ze) класифікована, інакше слово у фразу не береться;
//   3. слово з множиною лише там, де вона природна; слова лише з множиною (peníze) беруть множину.
//
// Контракт питання — спільний із рештою рушіїв: рівно [correct, distractor],
// comboId = id комбо в пулі НАПРЯМУ (безпечний патерн verb/declension рушіїв,
// не перерахунок — саме перерахунок ламав ваги в numeral). Набір комбо й квоти не змінювались.

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

function collapseVowelLength(s: string): string {
  return s
    .replace(/á/g, "a").replace(/í/g, "i").replace(/é/g, "e").replace(/ó/g, "o")
    .replace(/ú/g, "u").replace(/ů/g, "u").replace(/ý/g, "y").toLowerCase();
}

// Дистрактор не має відрізнятися від правильної форми лише довжиною голосного (занадто дрібно для вибору).
function isUsable(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== "—" && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

const CASES: CzechCase[] = ["nominativ", "genitiv", "dativ", "akuzativ", "lokal", "instrumental"];

const NUMBER_LABEL: Record<GrammaticalNumber, string> = { sg: "однина", pl: "множина" };

// Єдиний "хвіст" завдання: відмінок (укр+чес) + контрольне питання + число.
// Той самий формат, що в квізі прикметників/займенників (consistency).
function caseTail(c: CzechCase, n: GrammaticalNumber): string {
  const lbl = CASE_LABELS[c];
  return `${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${NUMBER_LABEL[n]}`;
}

// ─────────────── Пули партнерів ───────────────
// Партнер-пул: ті самі фільтри, що в numeral (не декоративні категорії: дні, місяці, числівники).
// Незлічувані лишаємо — «bez másla» цілком нормально (на відміну від «osm mas» у числівниках).
const PARTNER_POOL = NOUNS.filter((n) => nounUsableAsPartner(n.category));

const needsPools = new Map<string, NounEntry[]>();
function poolForNeeds(key: string, needs: Needs): NounEntry[] {
  let p = needsPools.get(key);
  if (!p) {
    p = PARTNER_POOL.filter((n) => matchesNeeds(n, needs));
    needsPools.set(key, p);
  }
  return p;
}

// Партнери фіксованого прийменника: «вузькі» — за тегами (FIXED_NEEDS), «широкі» — увесь пул без виключених класів.
function fixedPool(prepId: string): NounEntry[] {
  const needs = FIXED_NEEDS[prepId];
  if (needs) return poolForNeeds(`fixed:${prepId}`, needs);
  let p = needsPools.get(`fixed:${prepId}`);
  if (!p) {
    const banned = FIXED_EXCLUDE[prepId] ?? [];
    p = PARTNER_POOL.filter((n) => !(n.sem ?? []).some((t) => banned.includes(t)));
    needsPools.set(`fixed:${prepId}`, p);
  }
  return p;
}

function framePool(prepId: string, kind: string, f: DualFrame): NounEntry[] {
  return poolForNeeds(`frame:${prepId}:${kind}:${f.text}`, f);
}

// Слова, придатні хоча б до одного фрейму комбо (прийменник × сенс). Добір іде від СЛОВА, а не від фрейму: слово,
// що підходить до двадцяти фреймів (most, dům), інакше з'являлося б у двадцять разів частіше за слово з одним.
const unionPools = new Map<string, NounEntry[]>();
function unionPool(prepId: string, kind: string, frames: DualFrame[]): NounEntry[] {
  const key = `${prepId}:${kind}`;
  let u = unionPools.get(key);
  if (!u) {
    const seen = new Set<string>();
    u = [];
    for (const f of frames) for (const n of framePool(prepId, kind, f)) if (!seen.has(n.id)) { seen.add(n.id); u.push(n); }
    unionPools.set(key, u);
  }
  return u;
}

// Перший придатний кандидат у ВИПАДКОВОМУ порядку: рівномірний серед придатних і повний (знаходить, якщо
// хоч один є — питання не губиться через невдалу вибірку).
function firstValid<T>(cands: NounEntry[], tryOne: (n: NounEntry) => T | null): T | null {
  for (const n of shuffle(cands)) {
    const r = tryOne(n);
    if (r) return r;
  }
  return null;
}

// Дистрактор до фіксованого прийменника / обміну: той самий партнер в іншому відмінку, у ТОМУ Ж числі.
// Виключаємо nominativ і vokativ (жоден прийменник ними не керує — надто очевидно) та будь-який відмінок,
// форма якого збігається з прийнятою формою правильної клітинки (дублет чи variants).
function nounDistractor(noun: NounEntry, correctCase: CzechCase, n: GrammaticalNumber, correct: string): string | null {
  const target = acceptedForms(noun, correctCase, n);
  for (const cc of shuffle(CASES.filter((c) => c !== correctCase && c !== "nominativ"))) {
    const f = formOf(noun, cc, n);
    if (!isUsable(correct, f)) continue;
    if (!disjoint(target, acceptedForms(noun, cc, n))) continue;
    return f;
  }
  return null;
}

// Дистрактор для dual: форма ІНШОГО з двох відмінків (рух ↔ спокій). Якщо вона збігається з правильною або
// відрізняється лише довжиною голосного (restauraci / restaurací — саме те, що учень має розрізняти, але вибір
// «лише за довжиною» не годиться для питання), беремо будь-який інший відмінок, як і раніше.
function dualDistractor(noun: NounEntry, c: CzechCase, otherCase: CzechCase, num: GrammaticalNumber, correct: string): string | null {
  const other = formOf(noun, otherCase, num);
  if (isUsable(correct, other) && disjoint(acceptedForms(noun, c, num), acceptedForms(noun, otherCase, num))) return other;
  return nounDistractor(noun, c, num, correct);
}

// ─────────────── Підтип fixed-noun ───────────────
function buildFixedNoun(prep: PrepositionEntry): PrepQuestion | null {
  const c = prep.govCase;
  const pick = firstValid(fixedPool(prep.id), (noun) => {
    for (const num of candidateNumbers(noun, "any")) {
      const correct = formOf(noun, c, num);
      if (!correct) continue;
      const shown = vocalizedPrep(prep, correct);
      if (shown === null) continue;
      const distractor = nounDistractor(noun, c, num, correct);
      if (distractor) return { num, correct, distractor, shown };
    }
    return null;
  });
  if (!pick) return null;
  return {
    comboId: comboId(prep.id, "fixnoun", c),
    promptWord: prep.cz,
    promptUk: prep.uk,
    promptLabel: "прийменник",
    taskText: `Оберіть форму іменника після «${prep.cz}»: ${caseTail(c, pick.num)}`,
    contextPhrase: `${pick.shown} ___`,
    correct: pick.correct,
    options: shuffle([pick.correct, pick.distractor]),
  };
}

// ─────────────── Підтип fixed-prep ───────────────
// Дистрактор — інший прийменник ТОГО САМОГО відмінка (з усіх: fixed за govCase, dual за релевантним сенсом),
// щоб тестувати значення, а не вгадування за формою.
function glossWords(uk: string): Set<string> {
  return new Set(uk.toLowerCase().split(/[^а-яіїєґ']+/).filter(Boolean));
}

// «Сусід» не має ділити жодного слова з українським значенням правильного: інакше обидві відповіді підходять
// за змістом (u «біля / у (когось)» ↔ vedle «поряд із / біля»: «Bydlím u/vedle nádraží»).
function sharesMeaning(a: PrepositionEntry, b: PrepositionEntry): boolean {
  const wa = glossWords(a.uk);
  for (const w of glossWords(b.uk)) if (wa.has(w)) return true;
  return false;
}

function prepsGoverning(c: CzechCase, exceptId: string): PrepositionEntry[] {
  const out: PrepositionEntry[] = [];
  const self = PREPOSITIONS.find((x) => x.id === exceptId);
  for (const p of PREPOSITIONS) {
    if (p.id === exceptId) continue;
    if (self && sharesMeaning(self, p)) continue;
    if (CONFUSABLE_PREP_PAIRS.some(([x, y]) => (x === exceptId && y === p.id) || (y === exceptId && x === p.id))) continue;
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
  // Партнер береться за правилами ПРАВИЛЬНОГО прийменника; обидва варіанти відповіді показуємо з вокалізацією
  // перед цим словом («ke klukům», а не «k klukům»), тому слово має бути класифіковане для обох.
  for (const nb of shuffle(prepsGoverning(c, prep.id))) {
    const pick = firstValid(fixedPool(prep.id), (noun) => {
      for (const num of candidateNumbers(noun, "any")) {
        const form = formOf(noun, c, num);
        if (!form) continue;
        const a = vocalizedPrep(prep, form);
        const b = vocalizedPrep(nb, form);
        if (a !== null && b !== null && a !== b) return { num, form, a, b };
      }
      return null;
    });
    if (pick) {
      return {
        comboId: comboId(prep.id, "fixprep", c),
        promptWord: prep.uk,
        promptUk: "",
        promptLabel: "прийменник",
        taskText: `Який прийменник підходить за змістом? Керує відмінком ${caseTail(c, pick.num)}`,
        contextPhrase: `___ ${pick.form}`,
        correct: pick.a,
        options: shuffle([pick.a, pick.b]),
      };
    }
  }
  return null;
}

// ─────────────── Підтип dual (напрямок/спокій) ───────────────
type DualSense = "motion" | "location";

function buildDual(prep: PrepositionEntry, sense: DualSense): PrepQuestion | null {
  if (!prep.dual) return null;
  const senseData = sense === "motion" ? prep.dual.motion : prep.dual.location;
  const otherData = sense === "motion" ? prep.dual.location : prep.dual.motion;
  const c = senseData.govCase;
  const otherCase = otherData.govCase;
  const frames = DUAL_FRAMES[prep.id]?.[sense];
  if (!frames || frames.length === 0) return null;

  // Слово — рівномірно серед придатних до комбо (а не фрейм-першим: див. unionPool); фрейм — рівномірно
  // серед тих, куди слово підходить і де вийшла коректна пара форм.
  const pick = firstValid(unionPool(prep.id, sense, frames), (noun) => {
    for (const frame of shuffle(frames.filter((f) => matchesNeeds(noun, f)))) {
      for (const num of candidateNumbers(noun, frame.num ?? "sg")) {
        const correct = formOf(noun, c, num);
        if (!correct) continue;
        const shown = vocalizedPrep(prep, correct);
        if (shown === null) continue;
        const distractor = dualDistractor(noun, c, otherCase, num, correct);
        if (distractor) return { frame, num, correct, distractor, shown };
      }
    }
    return null;
  });
  if (!pick) return null;

  // Знахідний = напрямок/ціль (рух АБО об'єкт дії: «Věřím v tebe», «Čekám na autobus»): «рух — куди?» було б
  // хибним для таких фреймів.
  const senseUk = sense === "motion" ? "напрямок / ціль — куди? у що?" : "спокій / дія без напрямку — де?";
  return {
    comboId: comboId(prep.id, `dual-${sense}`, c),
    promptWord: prep.cz,
    promptUk: prep.uk,
    promptLabel: "прийменник",
    taskText: `«${prep.cz}» — ${senseUk} Оберіть форму: ${caseTail(c, pick.num)}`,
    contextPhrase: pick.frame.text.replace("{p}", pick.shown),
    correct: pick.correct,
    options: shuffle([pick.correct, pick.distractor]),
  };
}

// ─────────────── Підтип za-exchange ───────────────
function buildZaExchange(prep: PrepositionEntry): PrepQuestion | null {
  if (!prep.dual?.exchange) return null;
  const c = prep.dual.exchange.govCase; // akuzativ
  const frame = EXCHANGE_FRAMES[Math.floor(Math.random() * EXCHANGE_FRAMES.length)];
  const pick = firstValid(framePool(prep.id, "exchange", frame), (noun) => {
    for (const num of candidateNumbers(noun, frame.num ?? "sg")) {
      const correct = formOf(noun, c, num);
      if (!correct) continue;
      const distractor = nounDistractor(noun, c, num, correct);
      if (distractor) return { num, correct, distractor };
    }
    return null;
  });
  if (!pick) return null;
  return {
    comboId: comboId(prep.id, "za-exchange", c),
    promptWord: prep.cz,
    promptUk: "за (обмін / ціна)",
    promptLabel: "прийменник",
    taskText: `«za» — обмін / ціна (скільки заплатив). Оберіть форму: ${caseTail(c, pick.num)}`,
    contextPhrase: frame.text.replace("{p}", prep.cz),
    correct: pick.correct,
    options: shuffle([pick.correct, pick.distractor]),
  };
}

// ─────────────── Dev-перевірка даних (лише у dev-збірці, нічого не блокує) ───────────────
// Попереджає, коли додане слово чи фрейм ламає припущення: порожні/суперечливі теги, фрейм із замалим пулом,
// слово, яке не береться у фрази з v/k/s/z через неописану початкову групу приголосних.
function devCheckData(): void {
  const issues: string[] = [];
  for (const n of NOUNS) issues.push(...validateNounSem(n));
  const small = (label: string, n: number, min: number) => {
    if (n < min) issues.push(`пул «${label}» має лише ${n} слів (потрібно ≥ ${min})`);
  };
  for (const [pid, f] of Object.entries(DUAL_FRAMES)) {
    for (const sense of ["motion", "location"] as DualSense[]) for (const fr of f[sense]) small(`${pid}.${sense} «${fr.text}»`, framePool(pid, sense, fr).length, 3);
  }
  for (const pid of Object.keys(FIXED_NEEDS)) small(`${pid} (вузький)`, fixedPool(pid).length, 8);
  if (issues.length > 0) console.warn(`prepositionQuiz: ${issues.length} зауваж.:\n  ` + issues.slice(0, 25).join("\n  "));
}
if (typeof __DEV__ !== "undefined" && __DEV__) devCheckData();

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
  // fixprep («обери прийменник за значенням») — унікальніший навик: більше ніде
  // в застосунку не тестується вибір САМОГО прийменника, тоді як відмінювання
  // іменника (fixnoun) частково перетинається з окремим квізом «Відмінки».
  // Тому fixprep пріоритетніший — вищий мінімум, ніж fixnoun.
  minSlots: { fixnoun: 3, fixprep: 4, dual: 3, exchange: 1 },
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
