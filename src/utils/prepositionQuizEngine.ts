import { CzechCase, NounEntry, PrepositionEntry, CASE_LABELS, GrammaticalNumber, Gender, PersonalDeclension, PersonalPronounEntry } from "../types";
import { PREPOSITIONS } from "../data/prepositions";
import { NOUNS } from "../data/nouns";
import { COLS_NP, PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { nounUsableAsPartner } from "../data/categories";
import { validateNounSem } from "../data/nounTags";
import { CONFUSABLE_PREP_PAIRS, DUAL_FRAMES, EXCHANGE_FRAMES, FIXED_FRAMES, Frame, Needs, PRONOUN_FRAMES } from "../data/prepositionPartners";
import { acceptedForms, candidateNumbers, disjoint, fitCounts, formOf, freshWeightedOrder, matchesNeeds, vocalizedPrep } from "./partnerSelection";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
import { NUMBER_LABEL, formsOf, isUsableDistractor, once, shuffle, topUpRound } from "./quizCommon";

// ─────────────────────────── Квіз «Прийменники» ───────────────────────────
// Одна категорія «Флеш-картки», кілька механік (як «Числівники» / «Час і дата»):
//   • fixed-noun     — прийменник видно, обери ФОРМУ іменника-партнера (відмінок, яким керує прийменник).
//   • fixed-prep     — переклад видно, обери сам ПРИЙМЕННИК. Дистрактор — «сусід по відмінку» з іншим значенням.
//   • dual           — прийменник видно + taskText каже НАПРЯМОК/ЦІЛЬ чи СПОКІЙ; обери форму партнера у правильному з
//                      двох відмінків. Дистрактор — той самий партнер в ІНШОМУ з двох відмінків.
//   • za-exchange    — «za» у сенсі обмін/ціна (знахідний).
//   • pronoun        — прийменник + особовий займенник 3-ї особи: обери форму після прийменника (k němu, а не
//                      k jemu). Дистрактор — форма «без прийменника» того ж займенника й відмінка.
//
// ПАРТНЕР (іменник у фразі) підбирається за СМИСЛОВИМИ ТЕГАМИ (data/nounTags.ts), а не навмання з усього
// словника: фрази природні («Jsem ve škole», «Jdu na poštu», «Mám dopis od kamaráda»), а новий іменник з
// правильними тегами потрапляє в усі підхожі фрази автоматично. Фрейми всіх прийменників (двоїстих, фіксованих,
// «za» обміну) — дані одного типу Frame у data/prepositionPartners.ts, добір слова — одна функція pickPartner.
//
// Гарантії кожного питання (перевіряє dev-прогін, див. validate нижче):
//   1. правильна відповідь і дистрактор — різні форми, жодна прийнятна форма правильної клітинки (дублети,
//      variants) не стоїть серед дистракторів;
//   2. вокалізація прийменника (ve/ke/se/ze) класифікована, інакше слово у фразу не береться;
//   3. слово з множиною лише там, де вона природна; слова лише з множиною (peníze) беруть множину;
//   4. в одному раунді іменник не повторюється (якщо для комбо є інше придатне слово), а слово, що підходить
//      до багатьох комбо (most, dům), не домінує: вага слова = 1 / (кількість пулів, де воно є).
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

const CASES: CzechCase[] = ["nominativ", "genitiv", "dativ", "akuzativ", "lokal", "instrumental"];


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

function framePool(prepId: string, kind: string, f: Frame): NounEntry[] {
  // ключ — текст І вимоги: два фрейми з однаковим текстом, але різними тегами не ділять кеш
  return poolForNeeds(`frame:${prepId}:${kind}:${f.text}:${JSON.stringify([f.any, f.all, f.none])}`, f);
}

// Слова, придатні хоча б до одного фрейму пулу (прийменник × сенс). Добір іде від СЛОВА, а не від фрейму: слово,
// що підходить до двадцяти фреймів, інакше з'являлося б у двадцять разів частіше за слово з одним.
const unionPools = new Map<string, NounEntry[]>();
function unionPool(prepId: string, kind: string, frames: Frame[]): NounEntry[] {
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

type DualSense = "motion" | "location";
const SENSES: DualSense[] = ["motion", "location"];

// Усі пули квізу (ключ — як в unionPool): один на фіксований прийменник, по одному на сенс двоїстого, обмін «za».
function allPools(): NounEntry[][] {
  const out: NounEntry[][] = [];
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") {
      const fr = FIXED_FRAMES[p.id];
      if (fr) out.push(unionPool(p.id, "fixed", fr));
    } else if (p.dual) {
      for (const sense of SENSES) {
        const fr = DUAL_FRAMES[p.id]?.[sense];
        if (fr) out.push(unionPool(p.id, sense, fr));
      }
      if (p.dual.exchange) out.push(unionPool(p.id, "exchange", EXCHANGE_FRAMES));
    }
  }
  return out;
}

// У скількох пулах є слово. most чи dům підходять до більшості просторових фраз і без поправки займали б помітну
// частку всіх питань; вага 1 / fit вирівнює частку слова у квізі. Рахується з даних, тож нові слова й фрейми
// враховуються самі.
const FIT = once(() => fitCounts(PARTNER_POOL, allPools(), (n, pool) => pool.includes(n)));
const fitCount = (nounId: string) => FIT().get(nounId) ?? 1;

// Порядок перебору кандидатів: спершу слова, яких ще не було в раунді, всередині вага 1 / fit (freshWeightedOrder).
// Перебір повний: якщо в комбо придатні лише вже використані слова, береться одне з них — питання (зокрема
// зарезервоване під помилку) не губиться.
function partnerOrder(cands: NounEntry[], used: ReadonlySet<string>): NounEntry[] {
  return freshWeightedOrder(cands, (n) => used.has(n.id), (n) => fitCount(n.id));
}

interface PartnerPick<T> {
  noun: NounEntry;
  frame: Frame;
  num: GrammaticalNumber;
  data: T;
}

// Єдиний добір партнера для всіх типів питань: слово (див. partnerOrder) → фрейм, куди воно підходить (навмання)
// → число за політикою фрейму; `tryForm` перевіряє форми й повертає дані питання або null (тоді пробуємо далі).
function pickPartner<T>(
  prepId: string,
  kind: string,
  c: CzechCase, // відмінок форми слова у фразі: candidateNumbers не дасть форми, якої мова не вживає («k patru»)
  frames: Frame[],
  used: ReadonlySet<string>,
  tryForm: (noun: NounEntry, num: GrammaticalNumber) => T | null
): PartnerPick<T> | null {
  for (const noun of partnerOrder(unionPool(prepId, kind, frames), used)) {
    for (const frame of shuffle(frames.filter((f) => matchesNeeds(noun, f)))) {
      for (const num of candidateNumbers(noun, c, frame.num ?? "sg", Math.random, frame.plOk)) {
        const data = tryForm(noun, num);
        if (data) return { noun, frame, num, data };
      }
    }
  }
  return null;
}

// Питання + id іменника (рушій веде облік слів раунду).
interface Built {
  q: PrepQuestion;
  nounId: string;
}

// Дистрактор до фіксованого прийменника / обміну: той самий партнер в іншому відмінку, у ТОМУ Ж числі.
// Виключаємо nominativ і vokativ (жоден прийменник ними не керує — надто очевидно) та будь-який відмінок,
// форма якого збігається з прийнятою формою правильної клітинки (дублет чи variants).
function nounDistractor(noun: NounEntry, correctCase: CzechCase, n: GrammaticalNumber, correct: string): string | null {
  const target = acceptedForms(noun, correctCase, n);
  for (const cc of shuffle(CASES.filter((c) => c !== correctCase && c !== "nominativ"))) {
    const f = formOf(noun, cc, n);
    if (!isUsableDistractor(correct, f)) continue;
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
  if (isUsableDistractor(correct, other) && disjoint(acceptedForms(noun, c, num), acceptedForms(noun, otherCase, num))) return other;
  return nounDistractor(noun, c, num, correct);
}

// ─────────────── Підтип fixed-noun ───────────────
function buildFixedNoun(prep: PrepositionEntry, used: ReadonlySet<string>): Built | null {
  const c = prep.govCase;
  const frames = FIXED_FRAMES[prep.id];
  if (!frames) return null;
  const pick = pickPartner(prep.id, "fixed", c, frames, used, (noun, num) => {
    const correct = formOf(noun, c, num);
    if (!correct) return null;
    const shown = vocalizedPrep(prep, correct);
    if (shown === null) return null;
    const distractor = nounDistractor(noun, c, num, correct);
    return distractor ? { correct, distractor, shown } : null;
  });
  if (!pick) return null;
  const { correct, distractor, shown } = pick.data;
  return {
    nounId: pick.noun.id,
    q: {
      comboId: comboId(prep.id, "fixnoun", c),
      promptWord: prep.cz,
      promptUk: prep.uk,
      promptLabel: "прийменник",
      taskText: `Оберіть форму іменника після «${prep.cz}»: ${caseTail(c, pick.num)}`,
      contextPhrase: pick.frame.text.replace("{p}", shown),
      correct,
      options: shuffle([correct, distractor]),
    },
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

function buildFixedPrep(prep: PrepositionEntry, used: ReadonlySet<string>): Built | null {
  const c = prep.govCase;
  const frames = FIXED_FRAMES[prep.id];
  if (!frames) return null;
  // Партнер і фрейм — за правилами ПРАВИЛЬНОГО прийменника; обидва варіанти відповіді показуємо з вокалізацією
  // перед цим словом («ke klukům», а не «k klukům»), тому слово має бути класифіковане для обох.
  for (const nb of shuffle(prepsGoverning(c, prep.id))) {
    const pick = pickPartner(prep.id, "fixed", c, frames, used, (noun, num) => {
      const form = formOf(noun, c, num);
      if (!form) return null;
      const a = vocalizedPrep(prep, form);
      const b = vocalizedPrep(nb, form);
      return a !== null && b !== null && a !== b ? { form, a, b } : null;
    });
    if (pick) {
      const { form, a, b } = pick.data;
      return {
        nounId: pick.noun.id,
        q: {
          comboId: comboId(prep.id, "fixprep", c),
          promptWord: prep.uk,
          promptUk: "",
          promptLabel: "прийменник",
          taskText: `Який прийменник підходить за змістом? Керує відмінком ${caseTail(c, pick.num)}`,
          // спершу форма іменника на місце «___», потім пропуск на місце прийменника
          contextPhrase: pick.frame.text.replace("___", form).replace("{p}", "___"),
          correct: a,
          options: shuffle([a, b]),
        },
      };
    }
  }
  return null;
}

// ─────────────── Підтип dual (напрямок/спокій) ───────────────
function buildDual(prep: PrepositionEntry, sense: DualSense, used: ReadonlySet<string>): Built | null {
  if (!prep.dual) return null;
  const senseData = sense === "motion" ? prep.dual.motion : prep.dual.location;
  const otherData = sense === "motion" ? prep.dual.location : prep.dual.motion;
  const c = senseData.govCase;
  const otherCase = otherData.govCase;
  const frames = DUAL_FRAMES[prep.id]?.[sense];
  if (!frames || frames.length === 0) return null;

  const pick = pickPartner(prep.id, sense, c, frames, used, (noun, num) => {
    const correct = formOf(noun, c, num);
    if (!correct) return null;
    const shown = vocalizedPrep(prep, correct);
    if (shown === null) return null;
    const distractor = dualDistractor(noun, c, otherCase, num, correct);
    return distractor ? { correct, distractor, shown } : null;
  });
  if (!pick) return null;
  const { correct, distractor, shown } = pick.data;

  // Знахідний = напрямок/ціль (рух АБО об'єкт дії: «Věřím v tebe», «Čekám na autobus»): «рух — куди?» було б
  // хибним для таких фреймів.
  const senseUk = sense === "motion" ? "напрямок / ціль — куди? у що?" : "спокій / дія без напрямку — де?";
  return {
    nounId: pick.noun.id,
    q: {
      comboId: comboId(prep.id, `dual-${sense}`, c),
      promptWord: prep.cz,
      promptUk: prep.uk,
      promptLabel: "прийменник",
      taskText: `«${prep.cz}» — ${senseUk} Оберіть форму: ${caseTail(c, pick.num)}`,
      contextPhrase: pick.frame.text.replace("{p}", shown),
      correct,
      options: shuffle([correct, distractor]),
    },
  };
}

// ─────────────── Підтип za-exchange ───────────────
function buildZaExchange(prep: PrepositionEntry, used: ReadonlySet<string>): Built | null {
  if (!prep.dual?.exchange) return null;
  const c = prep.dual.exchange.govCase; // akuzativ
  const pick = pickPartner(prep.id, "exchange", c, EXCHANGE_FRAMES, used, (noun, num) => {
    const correct = formOf(noun, c, num);
    if (!correct) return null;
    const distractor = nounDistractor(noun, c, num, correct);
    return distractor ? { correct, distractor } : null;
  });
  if (!pick) return null;
  const { correct, distractor } = pick.data;
  return {
    nounId: pick.noun.id,
    q: {
      comboId: comboId(prep.id, "za-exchange", c),
      promptWord: prep.cz,
      promptUk: "за (обмін / ціна)",
      promptLabel: "прийменник",
      taskText: `«za» — обмін / ціна (скільки заплатив). Оберіть форму: ${caseTail(c, pick.num)}`,
      contextPhrase: pick.frame.text.replace("{p}", prep.cz),
      correct,
      options: shuffle([correct, distractor]),
    },
  };
}

// ─────────────── Підтип pronoun (прийменник + займенник) ───────────────
// Беремо лише займенники з колонками «без прийм. / після прийм.» (COLS_NP: on/ona/ono, oni): для них друга колонка —
// саме форма після прийменника. Роди з однаковими формами (masc_anim/masc_inan; усі роди «oni» поза називним)
// зливаються в одну групу, тож одна й та сама таблиця не дублюється.
interface PronounGroup {
  pron: PersonalPronounEntry;
  key: string; // рід-представник групи або "all" — частина comboId
  promptCz: string;
  promptUk: string;
  decl: PersonalDeclension;
}

function pronounGroups(): PronounGroup[] {
  const out: PronounGroup[] = [];
  for (const pron of PERSONAL_PRONOUNS) {
    if (pron.columns !== COLS_NP) continue;
    if (!pron.gendered) {
      out.push({ pron, key: "all", promptCz: pron.cz, promptUk: pron.uk, decl: pron.declension });
      continue;
    }
    const groups: { genders: Gender[]; decl: PersonalDeclension }[] = [];
    const sig = (d: PersonalDeclension) => JSON.stringify(CASES.filter((c) => c !== "nominativ").map((c) => d[c]));
    for (const g of Object.keys(pron.declension) as Gender[]) {
      const d = pron.declension[g];
      const hit = groups.find((x) => sig(x.decl) === sig(d));
      if (hit) hit.genders.push(g);
      else groups.push({ genders: [g], decl: d });
    }
    const czAll = pron.cz.split(" / ");
    const ukAll = pron.uk.split(" / ");
    for (const grp of groups) {
      const noms = [...new Set(grp.genders.map((g) => pron.declension[g].nominativ.a))];
      const whole = noms.length === czAll.length || ukAll.length !== czAll.length;
      out.push({
        pron,
        key: grp.genders[0],
        promptCz: whole ? pron.cz : noms.join(" / "),
        promptUk: whole ? pron.uk : noms.map((n) => ukAll[czAll.indexOf(n)] ?? pron.uk).join(" / "),
        decl: grp.decl,
      });
    }
  }
  return out;
}

const PREP_BY_ID = new Map(PREPOSITIONS.map((p) => [p.id, p]));

// Комірка придатна, якщо є обидві колонки й форма «без прийменника» не є прийнятною формою «після прийменника».
function pronounPair(decl: PersonalDeclension, c: CzechCase): { correct: string; plain: string } | null {
  const after = formsOf(decl[c].b);
  const plain = formsOf(decl[c].a)[0];
  if (after.length === 0 || !plain || after.includes(plain) || !isUsableDistractor(after[0], plain)) return null;
  return { correct: after[0], plain };
}

function buildPronoun(grp: PronounGroup, c: CzechCase, used: ReadonlySet<string>): Built | null {
  const pair = pronounPair(grp.decl, c);
  const frames = PRONOUN_FRAMES[c];
  if (!pair || !frames) return null;
  for (const frame of shuffle(frames)) {
    const prep = PREP_BY_ID.get(frame.prepId);
    if (!prep) continue;
    const shown = vocalizedPrep(prep, pair.correct);
    if (shown === null) continue;
    const lbl = CASE_LABELS[c];
    return {
      nounId: `pron:${grp.pron.id}:${grp.key}`,
      q: {
        comboId: comboId(grp.pron.id, `prep-${grp.key}`, c),
        promptWord: grp.promptCz,
        promptUk: grp.promptUk,
        promptLabel: "займенник",
        taskText: `Оберіть форму займенника після «${prep.cz}»: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`,
        contextPhrase: frame.text.replace("{p}", shown),
        correct: pair.correct,
        options: shuffle([pair.correct, pair.plain]),
      },
    };
  }
  return null;
}

// ─────────────── Dev-перевірка даних (лише у dev-збірці, нічого не блокує) ───────────────
// Попереджає, коли додане слово чи фрейм ламає припущення: порожні/суперечливі теги, фрейм із замалим пулом,
// фіксований прийменник без фреймів (він тоді не потрапляє у квіз).
function devCheckData(): void {
  const issues: string[] = [];
  for (const n of NOUNS) issues.push(...validateNounSem(n));
  const small = (label: string, n: number, min: number) => {
    if (n < min) issues.push(`пул «${label}» має лише ${n} слів (потрібно ≥ ${min})`);
  };
  for (const [pid, f] of Object.entries(DUAL_FRAMES)) {
    for (const sense of SENSES) for (const fr of f[sense]) small(`${pid}.${sense} «${fr.text}»`, framePool(pid, sense, fr).length, 3);
  }
  for (const p of PREPOSITIONS) {
    if (p.type !== "fixed") continue;
    const frames = FIXED_FRAMES[p.id];
    if (!frames) issues.push(`${p.id}: немає FIXED_FRAMES — прийменник не потрапляє у квіз`);
    else for (const fr of frames) small(`${p.id} «${fr.text}»`, framePool(p.id, "fixed", fr).length, 3);
  }
  for (const fr of Object.values(PRONOUN_FRAMES).flat()) if (fr && !PREP_BY_ID.has(fr.prepId)) issues.push(`PRONOUN_FRAMES: невідомий прийменник ${fr.prepId}`);
  if (issues.length > 0) console.warn(`prepositionQuiz: ${issues.length} зауваж.:\n  ` + issues.slice(0, 25).join("\n  "));
}
if (typeof __DEV__ !== "undefined" && __DEV__) devCheckData();

// ─────────────── Пул комбінацій ───────────────
type PrepKind = "fixnoun" | "fixprep" | "dual" | "exchange" | "pronoun";

interface Combo {
  id: string;
  wordId: string;
  kind: PrepKind;
  make: (used: ReadonlySet<string>) => Built | null;
}

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") {
      if (!FIXED_FRAMES[p.id]) continue; // без фреймів немає партнерів (dev-перевірка про це попереджає)
      combos.push({
        id: comboId(p.id, "fixnoun", p.govCase),
        wordId: p.id,
        kind: "fixnoun",
        make: (used) => buildFixedNoun(p, used),
      });
      // fixed-prep лише якщо є «сусід по відмінку» (інакше немає дистрактора)
      if (prepsGoverning(p.govCase, p.id).length > 0) {
        combos.push({
          id: comboId(p.id, "fixprep", p.govCase),
          wordId: p.id,
          kind: "fixprep",
          make: (used) => buildFixedPrep(p, used),
        });
      }
    } else if (p.dual) {
      for (const sense of SENSES) {
        const sd = sense === "motion" ? p.dual.motion : p.dual.location;
        combos.push({
          id: comboId(p.id, `dual-${sense}`, sd.govCase),
          wordId: p.id,
          kind: "dual",
          make: (used) => buildDual(p, sense, used),
        });
      }
      if (p.dual.exchange) {
        combos.push({
          id: comboId(p.id, "za-exchange", p.dual.exchange.govCase),
          wordId: p.id,
          kind: "exchange",
          make: (used) => buildZaExchange(p, used),
        });
      }
    }
  }
  for (const grp of pronounGroups()) {
    for (const c of CASES) {
      if (!PRONOUN_FRAMES[c] || !pronounPair(grp.decl, c)) continue;
      combos.push({
        id: comboId(grp.pron.id, `prep-${grp.key}`, c),
        wordId: grp.pron.id,
        kind: "pronoun",
        make: (used) => buildPronoun(grp, c, used),
      });
    }
  }
  return combos;
}

// Пул комбінацій залежить лише від даних — будується раз за запуск застосунку.
const defaultCombos = once(enumerateCombos);

// Квота: fixprep і exchange — менші/специфічні пули, гарантуємо їм присутність,
// щоб пропорційний вибір не витіснив (той самий підхід, що в datetime/adj-pron).
const PREP_KIND_QUOTA: KindQuota<PrepKind> = {
  kindOf: (c) => (c as Combo).kind,
  // fixprep («обери прийменник за значенням») — унікальніший навик: більше ніде
  // в застосунку не тестується вибір САМОГО прийменника, тоді як відмінювання
  // іменника (fixnoun) частково перетинається з окремим квізом «Відмінки».
  // Тому fixprep пріоритетніший — вищий мінімум, ніж fixnoun.
  // pronoun (k němu, s ní) — окремий навик, якого немає в жодному іншому квізі: гарантований 1 слот із 12; місце
  // для нього звільнене з fixnoun (3 → 2), бо відмінювання іменників тренує ще й квіз «Відмінки».
  minSlots: { fixnoun: 2, fixprep: 4, dual: 3, exchange: 1, pronoun: 1 },
};

export function generatePrepositionSession(
  count: number,
  pool: Combo[] = defaultCombos(),
  mistakes: MistakeStore = {}
): PrepQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId, undefined, PREP_KIND_QUOTA);
  const questions: PrepQuestion[] = [];
  const used = new Set<string>(); // іменники цього раунду
  const take = (c: Combo) => {
    const b = c.make(used);
    if (!b) return;
    used.add(b.nounId);
    questions.push(b.q);
  };
  for (const c of chosen) take(c);
  topUpRound(questions, count, pool, take);
  return questions;
}
