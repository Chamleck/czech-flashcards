// Оракул покриття й граматики квізів: ОБОВ'ЯЗКОВО після додавання слів, фраз чи змін у логіці будь-якого квізу.
// Запуск (esbuild-бандл, як і решта перевірок проєкту; код виходу 1 — є ПОМИЛКИ):
//   npx esbuild scripts/check-quiz-coverage.ts --bundle --platform=node --format=cjs --outfile=node_modules/.check-quiz-coverage.cjs
//   node node_modules/.check-quiz-coverage.cjs              — перевірка всіх квізів (~4 хв)
//   node node_modules/.check-quiz-coverage.cjs --only=decl,nouns — лише вибрані (decl nouns numerals preps verbs adverbs datetime)
//   node node_modules/.check-quiz-coverage.cjs --self-test  — перевірка самого оракула: підкидає відомі помилки
//                                                             (зниклу клітинку, хибну правильну відповідь, дійсну форму
//                                                             як дистрактор, «{s}», чужого власника, хибну вокалізацію)
//                                                             і вимагає, щоб кожну було спіймано
//
// ЩО ПЕРЕВІРЯЄ
//  1. Покриття. Список обов'язкових клітинок будується з ТАБЛИЦЬ ФОРМ у даних (src/data), а не з рушія: кожна форма
//     кожного слова, що існує в мові. Кожну клітинку квіз мусить питати: оракул «змушує» рушій поставити саме її
//     (позначає як помилку в сховищі помилок — публічний API generate*Session) і перевіряє, що питання прийшло.
//     Виняток — лише із закритого списку правил нижче (EXCLUDED), кожне з причиною; інакше — ПОМИЛКА.
//  2. Граматика кожного питання, незалежно від рушія: правильна відповідь — форма цільової клітинки з таблиці; дистрактор
//     — НЕ жодна прийнятна форма цієї клітинки (усі дублети й variants); 2 різні варіанти; один пропуск; жодних «{…}»,
//     «undefined», «—»; прийменник перед пропуском вокалізований однаково для обох кнопок; у «чий?» власник з першого
//     речення однозначний і визначає відповідь.
//  3. Відомі дірки (KNOWN) — заплановані, але ще не закриті роботи (roadmap). Друкуються окремо; закрив — прибери рядок.
//
// Природність речень оракул не оцінює: її перевіряє читання пар «фраза × слово» (правила в шапках data-файлів).

import type { MistakeStore } from "../src/utils/flashcardWeights";
import { generateDeclensionSession, DeclQuestion } from "../src/utils/declensionFlashcardEngine";
import { generateSession as generateNounSession, Question as NounQuestion } from "../src/utils/flashcardEngine";
import { generateNumeralAgreementSession } from "../src/utils/numeralAgreementEngine";
import { generatePrepositionSession } from "../src/utils/prepositionQuizEngine";
import { generateVerbSession } from "../src/utils/verbFlashcardEngine";
import { generateAdverbSession } from "../src/utils/adverbQuizEngine";
import { generateDateTimeSession } from "../src/utils/datetimeEngine";
import { acceptedForms, vocalDecision } from "../src/utils/partnerSelection";
import { PAST_SUBJECT_ORDER, IMPERATIVE_ORDER, presentForm, futureForm, pastForm, imperativeForm } from "../src/utils/verbForms";
import type { VocalPrep } from "../src/data/prepositionPartners";
import { ADJECTIVES } from "../src/data/adjectives";
import { PRONOUNS } from "../src/data/pronouns";
import { PERSONAL_PRONOUNS, PERSONAL_QUIZ_FORMS } from "../src/data/personalPronouns";
import { INTERROGATIVE_ADJ, INTERROGATIVE_CORE } from "../src/data/interrogativePronouns";
import { INDEFINITE_ADJ, INDEFINITE_CORE } from "../src/data/indefinitePronouns";
import { NOUNS } from "../src/data/nouns";
import { VERBS } from "../src/data/verbs";
import { BYT_FUTURE } from "../src/data/auxVerbs";
import { ADVERBS } from "../src/data/adverbs";
import { PREPOSITIONS } from "../src/data/prepositions";
import { CARDINALS } from "../src/data/cardinals";
import { DATE_ORDINALS } from "../src/data/dates";
import { NOUN_CATS_EXCLUDED_FROM_QUIZ } from "../src/data/categories";
import { adjQuizUsable } from "../src/data/adjectiveCategories";
import { CASE_ORDER, CzechCase, FullDeclension, Gender, GENDER_ORDER, GrammaticalNumber, NounEntry, PERSON_ORDER, PronounEntry, PronounQuiz, VerbEntry } from "../src/types";

// ─────────────── Звіт ───────────────
interface Report {
  errors: string[];
  known: string[];
  excluded: Map<string, number>; // причина → кількість клітинок
}
const newReport = (): Report => ({ errors: [], known: [], excluded: new Map() });
const exclude = (r: Report, reason: string) => r.excluded.set(reason, (r.excluded.get(reason) ?? 0) + 1);

// Відомі дірки: квіз + підрядок опису → причина (заплановано, не закрито). Закрив — прибери рядок.
const KNOWN: { quiz: string; match: string; reason: string }[] = [
  { quiz: "Числівники", match: "порядков", reason: "порядкові числівники (první, druhý…) — у квіз «Числівники» (рішення 2026-10-06)" },
  { quiz: "Числівники", match: "card-dva instrumental чол. іст.", reason: "dva + чол. істот. іменник в орудному не трапляється — розібрати в рефакторі числівників" },
  { quiz: "Прийменники", match: "prep-v::dual-location::lokal мн.", reason: "v + місцевий множини (ve školách) — фрази лише в однині, рефактор прийменників" },
];
function gap(r: Report, quiz: string, msg: string): void {
  if (FOCUS && !FOCUS.some((p) => msg.includes(p))) return; // самоперевірка: решта слів не прогонялась
  const k = KNOWN.find((x) => x.quiz === quiz && msg.includes(x.match));
  if (k) r.known.push(`${quiz}: ${msg} — ${k.reason}`);
  else r.errors.push(`${quiz}: ПОКРИТТЯ — ${msg}`);
}

// ─────────────── Спільне ───────────────
interface AnyQ {
  comboId: string;
  correct: string;
  options: string[];
  contextPhrase?: string;
  taskText: string;
}
type Gen<Q extends AnyQ> = (store: MistakeStore) => Q[];
const SESSION = 12;
const TRIES = 3;
const split = (cell: string | undefined): string[] => (!cell || cell === "—" ? [] : cell.split(" / ").map((s) => s.trim()));
const distractorOf = (q: AnyQ) => q.options.find((o) => o !== q.correct);
// Самоперевірка звужує прогін до слів, у які підкинуто помилку (інакше кожен випадок — повний прогін на хвилини).
let FOCUS: string[] | null = null;
const inFocus = (id: string) => !FOCUS || FOCUS.some((p) => id.startsWith(p));

// Комбо, яке квіз мусить питати: позначаємо помилкою — рушій резервує під неї слот, якщо таке комбо існує.
function forced<Q extends AnyQ>(gen: Gen<Q>, id: string): Q[] {
  const out: Q[] = [];
  if (!inFocus(id)) return out;
  for (let i = 0; i < TRIES; i++) out.push(...gen({ [id]: 1 }).filter((q) => q.comboId === id));
  return out;
}

function basic(r: Report, quiz: string, q: AnyQ): void {
  const bad = (m: string) => r.errors.push(`${quiz}: ${q.comboId}: ${m} — «${q.contextPhrase ?? ""}» [${q.options.join(" / ")}]`);
  if (q.options.length !== 2 || q.options[0] === q.options[1]) bad("не 2 різні варіанти");
  if (!q.options.includes(q.correct)) bad("правильної відповіді немає серед варіантів");
  // «—» законне лише в тексті завдання («Називний (Nominativ) — Kdo? Co?»); у фразі й на кнопках — порожня клітинка.
  if ([q.contextPhrase ?? "", q.taskText, ...q.options].some((t) => /[{}]|undefined/.test(t))) bad("залишок «{…}» чи «undefined»");
  if ([q.contextPhrase ?? "", ...q.options].some((t) => t.includes("—"))) bad("«—» (порожня клітинка) у фразі чи на кнопці");
  if (q.contextPhrase !== undefined && q.contextPhrase.includes("___") && q.contextPhrase.split("___").length !== 2) bad("пропусків не один");
}

// Прийменник v/k/s/z (ve/ke/se/ze) просто перед пропуском: обидві кнопки мусять вимагати саме такий вигляд.
// Зворотне se («Bojím se ___») прийменником не є — береться лише там, де рушій ставить прийменник ({v}{k}{s}{z}):
// перевіряємо, лише коли на місці пропуску прикметник/займенник групи, а не особовий займенник.
function vocal(r: Report, quiz: string, q: AnyQ): void {
  const m = (q.contextPhrase ?? "").match(/(?:^|\s)(v|ve|k|ke|s|se|z|ze) ___/i);
  if (!m) return;
  if (/(bojím|bojíš|nebojím|ptám|jsem|jsi|vejdu|nevejdu|ti|mi|sis|napiješ|nenapiju) se ___/i.test(q.contextPhrase ?? "")) return;
  const prep = m[1].toLowerCase()[0] as VocalPrep;
  const used = m[1].length === 2 ? "vocal" : "plain";
  for (const o of q.options) if (vocalDecision(prep, o) !== used) r.errors.push(`${quiz}: ${q.comboId}: вокалізація «${m[1]}» не підходить до «${o}» — «${q.contextPhrase}»`);
}

// ═════════════ «Прикметники та займенники» ═════════════
interface Tested {
  id: string;
  decl: FullDeclension;
  quiz: PronounQuiz;
}
const ADJ_QUIZ = "Прикметники та займенники";
const QUIZ_CASES = CASE_ORDER.filter((c) => c !== "vokativ");
const NUMBERS: GrammaticalNumber[] = ["sg", "pl"];

function testedWords(r: Report): Tested[] {
  const out: Tested[] = [];
  for (const a of ADJECTIVES) {
    if (!adjQuizUsable(a.category)) {
      gap(r, "Числівники", `порядковий ${a.cz}: усі клітинки`);
      continue;
    }
    out.push({ id: a.id, decl: a.declension, quiz: {} });
    if (a.degrees && a.semClass === "quality" && a.quizDegrees) {
      out.push({ id: `${a.id}__comp`, decl: a.degrees.comparative.declension, quiz: {} });
      out.push({ id: `${a.id}__super`, decl: a.degrees.superlative.declension, quiz: {} });
    } else if (a.degrees) exclude(r, `${ADJ_QUIZ}: ступені не питаються (quizDegrees: false / не якісний)`);
  }
  for (const p of [...PRONOUNS, ...INTERROGATIVE_ADJ, ...INDEFINITE_ADJ] as PronounEntry[]) {
    if (!p.declinable) {
      exclude(r, `${ADJ_QUIZ}: незмінне слово — відмінювати нічого (jeho, jejich; їх тренує «чий?»)`);
      continue;
    }
    if (p.quiz?.skip) {
      exclude(r, `${ADJ_QUIZ}: quiz.skip (sám — свідоме рішення)`);
      continue;
    }
    out.push({ id: p.id, decl: p.declension, quiz: p.quiz ?? {} });
  }
  return out;
}

// Клітинка існує в мові (а не лише в таблиці): обмеження слова й наявність незлічуваного іменника для massSg.
function cellExists(r: Report, t: Tested, g: Gender, c: CzechCase, n: GrammaticalNumber): boolean {
  const q = t.quiz;
  if (q.num && q.num !== n) return exclude(r, `${ADJ_QUIZ}: лише ${q.num} (quiz.num: každý, kolikátý)`), false;
  if (q.needsOwner && c === "nominativ") return exclude(r, `${ADJ_QUIZ}: svůj у називному (без власника)`), false;
  if (q.nominative === false && c === "nominativ") return exclude(r, `${ADJ_QUIZ}: quiz.nominative = false`), false;
  if (q.massSg && n === "sg" && !NOUNS.some((x) => x.uncountable && x.gender === g))
    return exclude(r, `${ADJ_QUIZ}: všechen в однині без незлічуваних іменників цього роду (чол. істот.)`), false;
  return true;
}

function checkAdjPron(r: Report, gen: Gen<DeclQuestion>): void {
  for (const t of testedWords(r)) {
    const all = GENDER_ORDER.flatMap((g) => QUIZ_CASES.flatMap((c) => NUMBERS.map((n) => split(t.decl[g][c][n]))));
    for (const g of GENDER_ORDER)
      for (const c of QUIZ_CASES)
        for (const n of NUMBERS) {
          const target = split(t.decl[g][c][n]);
          if (target.length === 0 || !cellExists(r, t, g, c, n)) continue;
          if (!all.some((f) => f.length > 0 && f.every((x) => !target.includes(x)))) {
            exclude(r, `${ADJ_QUIZ}: усі форми слова однакові — дистрактора немає`);
            continue;
          }
          const id = `${t.id}::${g}_${c}::${n}`;
          const qs = forced(gen, id);
          if (qs.length === 0) gap(r, ADJ_QUIZ, `${id} не питається`);
          for (const q of qs) {
            basic(r, ADJ_QUIZ, q);
            vocal(r, ADJ_QUIZ, q);
            if (!target.includes(q.correct)) r.errors.push(`${ADJ_QUIZ}: ${id}: правильна «${q.correct}» не з клітинки (${target.join(" / ")})`);
            const d = distractorOf(q);
            if (d && target.includes(d)) r.errors.push(`${ADJ_QUIZ}: ${id}: дистрактор «${d}» — теж правильна форма`);
          }
        }
  }
  checkPersonal(r, gen);
  checkCore(r, gen);
  checkPossessive(r, gen);
}

// Особові: [без прийм., після прийм., наголошена] з даних PERSONAL_QUIZ_FORMS (3-тя особа) і з таблиць картки (1–2 особа,
// my, vy, se). Дублети картки поза цими формами (jej, něj, ono «je») — прийнятні варіанти, окремо не питаються.
function checkPersonal(r: Report, gen: Gen<DeclQuestion>): void {
  const PP_CASES = QUIZ_CASES.filter((c) => c !== "nominativ");
  const expect: { id: string; form: string; sameCase: string[]; stressed: boolean }[] = [];
  for (const e of PERSONAL_PRONOUNS) {
    if (e.gendered) {
      const tables = e.id === "pp-oni" ? [{ part: "pl", t: PERSONAL_QUIZ_FORMS.oni }] : (["masc_anim", "fem", "neut"] as const).map((g) => ({ part: g, t: PERSONAL_QUIZ_FORMS.on[g] }));
      for (const { part, t } of tables)
        for (const c of PP_CASES) {
          const row = (t as Partial<Record<CzechCase, string[]>>)[c];
          if (!row) continue;
          row.forEach((f, reg) => f && f !== "—" && expect.push({ id: `${e.id}::${part}_${c}::${reg}`, form: f, sameCase: row.filter((x) => x && x !== "—"), stressed: reg === 2 }));
        }
      continue;
    }
    const single = e.columns.b === "—";
    for (const c of PP_CASES) {
      const a = split(e.declension[c].a)[0];
      const b = split(e.declension[c].b)[0];
      const same = [...split(e.declension[c].a), ...split(e.declension[c].b)];
      if (single) {
        if (a) expect.push({ id: `${e.id}::x_${c}::?`, form: a, sameCase: same, stressed: false });
      } else {
        if (a) expect.push({ id: `${e.id}::x_${c}::0`, form: a, sameCase: same, stressed: false });
        if (b) expect.push({ id: `${e.id}::x_${c}::1`, form: b, sameCase: same, stressed: false });
      }
    }
  }
  for (const x of expect) {
    // одна форма на відмінок (my, vy): рушій ставить її у фразу без прийменника, а якщо такої немає — з прийменником
    const ids = x.id.endsWith("::?") ? [x.id.replace("::?", "::0"), x.id.replace("::?", "::1")] : [x.id];
    const qs = ids.flatMap((id) => forced(gen, id));
    if (qs.length === 0) gap(r, ADJ_QUIZ, `${ids[0]} («${x.form}») не питається`);
    for (const q of qs) {
      basic(r, ADJ_QUIZ, q);
      if (q.correct !== x.form) r.errors.push(`${ADJ_QUIZ}: ${q.comboId}: правильна «${q.correct}», а за даними «${x.form}»`);
      const d = distractorOf(q);
      if (d && !x.stressed && x.sameCase.includes(d)) r.errors.push(`${ADJ_QUIZ}: ${q.comboId}: дистрактор «${d}» — форма того ж відмінка`);
      if (d && x.stressed && d !== x.sameCase[0]) r.errors.push(`${ADJ_QUIZ}: ${q.comboId}: у наголошеного дистрактор має бути ненаголошена «${x.sameCase[0]}»`);
    }
  }
}

function checkCore(r: Report, gen: Gen<DeclQuestion>): void {
  for (const e of [...INTERROGATIVE_CORE, ...INDEFINITE_CORE]) {
    if (e.gendered) continue;
    for (const c of QUIZ_CASES.filter((cc) => cc !== "nominativ")) {
      const target = split(e.declension[c].a);
      if (target.length === 0) continue;
      const id = `${e.id}::${c}::0`;
      const qs = forced(gen, id);
      if (qs.length === 0) gap(r, ADJ_QUIZ, `${id} не питається`);
      for (const q of qs) {
        basic(r, ADJ_QUIZ, q);
        if (!target.includes(q.correct)) r.errors.push(`${ADJ_QUIZ}: ${id}: правильна «${q.correct}» не з клітинки`);
        const d = distractorOf(q);
        if (d && target.includes(d)) r.errors.push(`${ADJ_QUIZ}: ${id}: дистрактор «${d}» — теж правильна форма`);
      }
    }
  }
}

// «Чий?»: власник — останнє слово першого речення («Znáš tu ženu?»); за таблицею іменників визначаємо рід і число,
// вони мусять бути однозначні, і відповідь — форма того присвійного, чий власник збігся.
function checkPossessive(r: Report, gen: Gen<DeclQuestion>): void {
  const owners = PRONOUNS.filter((p) => p.quiz?.owner);
  const formOf = (p: PronounEntry, g: Gender, c: CzechCase, n: GrammaticalNumber) => (p.declinable ? split(p.declension[g][c][n])[0] : p.invariantForm);
  for (const p of owners)
    for (const c of QUIZ_CASES) {
      const id = `${p.id}::owner_${c}::x`;
      const qs = forced(gen, id);
      if (qs.length === 0) gap(r, ADJ_QUIZ, `${id} («чий?») не питається`);
      for (const q of qs) {
        basic(r, ADJ_QUIZ, q);
        const m = (q.contextPhrase ?? "").match(/^Znáš (.+?)\? (.+)$/);
        if (!m) {
          r.errors.push(`${ADJ_QUIZ}: ${id}: немає першого речення з власником — «${q.contextPhrase}»`);
          continue;
        }
        const last = m[1].split(" ").pop()!;
        const found = new Set<string>();
        for (const x of NOUNS)
          for (const nn of NUMBERS)
            if (split(x.declension.akuzativ[nn]).includes(last)) {
              const gg = nn === "pl" && x.plGender ? x.plGender : x.gender;
              found.add(nn === "pl" ? "pl" : gg === "fem" ? "f" : "m");
            }
        if (found.size !== 1) {
          r.errors.push(`${ADJ_QUIZ}: ${id}: власник «${last}» неоднозначний (${[...found].join(", ")}) — «${q.contextPhrase}»`);
          continue;
        }
        const owner = owners.find((o) => o.quiz?.owner === [...found][0])!;
        const expected = formOf(owner, q.gender, q.targetCase as CzechCase, q.targetNumber);
        if (q.correct !== expected) r.errors.push(`${ADJ_QUIZ}: ${id}: відповідь «${q.correct}», а власник «${last}» дає «${expected}»`);
        const d = distractorOf(q);
        const others = owners.filter((o) => o !== owner).map((o) => formOf(o, q.gender, q.targetCase as CzechCase, q.targetNumber));
        if (d && !others.includes(d)) r.errors.push(`${ADJ_QUIZ}: ${id}: дистрактор «${d}» — не форма іншого власника`);
        if (owners.some((o) => new RegExp(`(^|\\s)${o.cz.slice(0, 4)}`).test(m[1]))) r.errors.push(`${ADJ_QUIZ}: ${id}: присвійний у першому реченні — «${m[1]}»`);
      }
    }
}

// ═════════════ «Іменники» ═════════════
function checkNouns(r: Report, gen: Gen<NounQuestion>): void {
  const QUIZ = "Іменники";
  for (const n of NOUNS) {
    const pt = n.declension.nominativ.sg === "—";
    for (const c of CASE_ORDER)
      for (const num of NUMBERS) {
        if (split(n.declension[c][num]).length === 0) continue;
        if (NOUN_CATS_EXCLUDED_FROM_QUIZ.has(n.category)) { exclude(r, `${QUIZ}: категорія ${n.category} — тренує інший квіз`); continue; }
        if (c === "nominativ" && (num === "sg" || pt)) { exclude(r, `${QUIZ}: заголовок картки`); continue; }
        if (c === "vokativ" && !(n.sem ?? []).some((t) => t === "person" || t === "animal")) { exclude(r, `${QUIZ}: кличний не-особи (свідоме рішення)`); continue; }
        const id = `${n.id}::${c}::${num}`;
        const qs = forced(gen, id);
        if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
        const acc = acceptedForms(n, c, num);
        for (const q of qs) {
          basic(r, QUIZ, q);
          if (!acc.includes(q.correct)) r.errors.push(`${QUIZ}: ${id}: правильна «${q.correct}» не з клітинки`);
          const d = distractorOf(q);
          if (d && acc.includes(d)) r.errors.push(`${QUIZ}: ${id}: дистрактор «${d}» — прийнятна форма клітинки`);
        }
      }
  }
}

// ═════════════ «Числівники» ═════════════
function checkNumerals(r: Report, gen: Gen<AnyQ & { blank: string }>): void {
  const QUIZ = "Числівники";
  const cases = QUIZ_CASES;
  for (const cd of CARDINALS) {
    for (const c of cases) {
      const id = `${cd.id}::${c}::x`;
      const asked = new Set<string>();
      const qs: (AnyQ & { blank: string })[] = [];
      for (let i = 0; i < 40; i++) qs.push(...forced(gen, id));
      if (qs.length === 0) { gap(r, QUIZ, `${id} не питається`); continue; }
      for (const q of qs) { basic(r, QUIZ, q); if (q.blank === "numeral") asked.add(q.correct); }
      const forms = new Set<string>();
      if (cd.kind === "gendered") for (const g of GENDER_ORDER) forms.add(split(cd.declension[g][c].sg)[0]);
      else if (cd.kind === "twoForm") { forms.add(split(cd.forms[c].masc)[0]); forms.add(split(cd.forms[c].femNeut)[0]); }
      else if (cd.kind === "invariantDecl") forms.add(split(cd.forms[c])[0]);
      else forms.add(split(c === "nominativ" || c === "akuzativ" ? cd.direct : cd.oblique)[0]);
      for (const f of forms) if (f && !asked.has(f)) gap(r, QUIZ, `${cd.id} ${c}: форма «${f}» не питається`);
      if (cd.kind === "gendered" || cd.kind === "twoForm") {
        const labels: Record<Gender, string> = { masc_anim: "чол. іст.", masc_inan: "чол. неіст.", fem: "жін.", neut: "сер." };
        for (const g of GENDER_ORDER)
          if (!qs.some((q) => q.blank === "noun" && q.taskText.includes(labels[g])))
            gap(r, QUIZ, `${cd.id} ${c} ${labels[g]}: іменник цього роду не питається`);
      }
    }
    if ("pluralOnly" in cd && cd.pluralOnly) {
      const po = cd.pluralOnly;
      for (const c of cases) {
        const f = split(po.forms[c])[0];
        if (!f) continue;
        const qs: AnyQ[] = [];
        for (let i = 0; i < 40; i++) qs.push(...forced(gen, `${cd.id}::${c}::pt`)); // пропуск — числівник чи іменник, навмання
        if (!qs.some((q) => q.correct === f)) gap(r, QUIZ, `${cd.id} ${c}: «${f}» (лише множина) не питається`);
        for (const q of qs) basic(r, QUIZ, q);
      }
    }
  }
  for (const h of NOUNS.filter((n) => n.category === "numbers"))
    for (const c of cases) {
      const qs = forced(gen, `${h.id}::${c}::x`);
      if (qs.length === 0) gap(r, QUIZ, `${h.id} ${c} (сотні й тисячі) не питається`);
      for (const q of qs) basic(r, QUIZ, q);
    }
  for (const g of [1, 2, 3, 4, 5]) {
    const qs = forced(gen, `compound-${g}`);
    if (qs.length === 0) gap(r, QUIZ, `складені на …${g} не питаються`);
    for (const q of qs) basic(r, QUIZ, q);
  }
}

// ═════════════ «Прийменники» ═════════════
function checkPrepositions(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Прийменники";
  const numbersOf = (qs: AnyQ[]) => new Set<string>(qs.map((q) => (/множина/.test(q.taskText) ? "мн." : /однина/.test(q.taskText) ? "одн." : "")));
  const need = (id: string, both: boolean) => {
    const qs: AnyQ[] = [];
    for (let i = 0; i < 20; i++) qs.push(...forced(gen, id));
    if (qs.length === 0) return gap(r, QUIZ, `${id} не питається`);
    for (const q of qs) basic(r, QUIZ, q);
    if (both) for (const n of ["одн.", "мн."]) if (!numbersOf(qs).has(n)) gap(r, QUIZ, `${id} ${n} не питається`);
  };
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") {
      need(`${p.id}::fixnoun::${p.govCase}`, false);
      if (PREPOSITIONS.some((o) => o !== p && o.type === "fixed" && o.govCase === p.govCase)) need(`${p.id}::fixprep::${p.govCase}`, false);
      else exclude(r, `${QUIZ}: вибір прийменника — немає іншого з тим самим відмінком`);
    } else if (p.dual) {
      need(`${p.id}::dual-motion::${p.dual.motion.govCase}`, false);
      need(`${p.id}::dual-location::${p.dual.location.govCase}`, false);
      if (p.dual.exchange) need(`${p.id}::za-exchange::${p.dual.exchange.govCase}`, false);
    }
  }
  // число іменника в місцевому з v — окремо (відома дірка)
  const vq: AnyQ[] = [];
  for (let i = 0; i < 40; i++) vq.push(...forced(gen, "prep-v::dual-location::lokal"));
  if (!numbersOf(vq).has("мн.")) gap(r, QUIZ, "prep-v::dual-location::lokal мн. не питається");
}

// ═════════════ «Дієслова» ═════════════
// Форми, що належать дієслову (окремими словами): інфінітив, дієприкметники, теперішній, майбутній, наказовий.
function verbWords(v: VerbEntry): Set<string> {
  const w = new Set<string>([v.cz, ...Object.values(v.pastParticiple)]);
  for (const t of [v.present, v.future, v.imperative]) if (t) for (const f of Object.values(t)) split(f).forEach((x) => w.add(x));
  return w;
}
// budu/budeš… — допоміжне складеного майбутнього недоконаного; у доконаного його немає (budu psát / napíšu).
const BUDU = new Set(Object.values(BYT_FUTURE));
const DURATIVE_RE = /celý večer|celou noc|dvě hodiny|celé odpoledne|celý týden/;
const PERFECTIVE_RE = /za minutu|za pět minut|^Konečně|a bude hotovo/;

// Видове питання, незалежно від рушія: на кнопці правильної відповіді — форма тестованого дієслова (і жодної форми
// партнера), на дистракторі — навпаки; решта слів кнопок (допоміжне, se/si) та сама, з точністю до зворотності
// (spát / vyspat se) і budu складеного майбутнього; контекст вимагає саме вид тестованого: тривалість → недоконаний (лише durative), za + час /
// Konečně / «a bude hotovo» → доконаний (останнє — лише resultative), фазове дієслово перед пропуском → лише
// недоконаний ІНФІНІТИВ (дистрактор — доконаний інфінітив).
function checkAspect(r: Report, QUIZ: string, v: VerbEntry, q: AnyQ): void {
  const bad = (m: string) => r.errors.push(`${QUIZ}: ${q.comboId}: ${m} — «${q.contextPhrase ?? ""}» [${q.options.join(" / ")}]`);
  const p = VERBS.find((x) => x.id === v.aspectPairId);
  const d = distractorOf(q);
  if (!p || !d || !q.contextPhrase) {
    bad("немає партнера, дистрактора чи речення");
    return;
  }
  const mine = verbWords(v);
  const theirs = verbWords(p);
  const own = (opt: string, a: Set<string>, b: Set<string>) => {
    const t = opt.split(" ");
    return t.some((x) => a.has(x)) && !t.some((x) => b.has(x) && !a.has(x));
  };
  if (!own(q.correct, mine, theirs)) bad(`правильна «${q.correct}» — не форма ${v.cz}`);
  if (!own(d, theirs, mine)) bad(`дистрактор «${d}» — не форма ${p.cz}`);
  const rest = (opt: string, w: Set<string>) =>
    opt.split(" ").filter((x) => !w.has(x) && x !== "se" && x !== "si" && !BUDU.has(x)).map((x) => (x === "ses" || x === "sis" ? "jsi" : x)).join(" ");
  if (rest(q.correct, mine) !== rest(d, theirs)) bad("кнопки різняться не лише дієсловом (допоміжне / стиль)");
  const phase = VERBS.find((x) => x.phasal && verbWords(x).has(q.contextPhrase!.split(" ")[0].toLowerCase()));
  if (phase) {
    if (v.aspect !== "imperfective" || v.durative) bad("фазовий фрейм — лише для недоконаного з durative: false");
    if (!q.correct.split(" ").includes(v.cz) || !d.split(" ").includes(p.cz)) bad("після фазового дієслова — не інфінітиви");
    if (phase.id === v.id || phase.id === p.id) bad("фазове дієслово питає власну пару");
  } else if (DURATIVE_RE.test(q.contextPhrase)) {
    if (v.aspect !== "imperfective" || !v.durative) bad("тривалість — лише недоконаний з durative: true");
  } else if (PERFECTIVE_RE.test(q.contextPhrase)) {
    if (v.aspect !== "perfective") bad("контекст завершеності — лише доконаний");
    if (/a bude hotovo/.test(q.contextPhrase) && !v.resultative) bad("«a bude hotovo» з resultative: false");
  } else bad("невідомий тип видового фрейму");
}

function checkVerbs(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Дієслова";
  for (const v of VERBS) {
    const cells: [string, string, string | null][] = [];
    if (v.present) for (const p of PERSON_ORDER) cells.push(["present", p, presentForm(v, p)]);
    for (const p of PERSON_ORDER) cells.push(["future", p, futureForm(v, p)]);
    for (const s of PAST_SUBJECT_ORDER) cells.push(["past", s, pastForm(v, s)]);
    if (v.imperative) for (const p of IMPERATIVE_ORDER) cells.push(["imperative", p, imperativeForm(v, p)]);
    else exclude(r, `${QUIZ}: наказового способу немає (moci, muset, smět, růst)`);
    for (const [t, p, cell] of cells) {
      const forms = split(cell ?? undefined);
      if (forms.length === 0) continue;
      const id = `${v.id}::${t}::${p}`;
      const qs = forced(gen, id);
      if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
      for (const q of qs) {
        basic(r, QUIZ, q);
        if (q.correct !== forms[0]) r.errors.push(`${QUIZ}: ${id}: правильна «${q.correct}», а за даними «${forms[0]}»`);
        const d = distractorOf(q);
        if (d && forms.includes(d)) r.errors.push(`${QUIZ}: ${id}: дистрактор «${d}» — теж правильна форма клітинки`);
      }
    }
    if (v.aspectPairId) {
      const id = `${v.id}::aspect::x`;
      const qs: AnyQ[] = [];
      for (let i = 0; i < 4; i++) qs.push(...forced(gen, id));
      if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
      for (const q of qs) {
        basic(r, QUIZ, q);
        checkAspect(r, QUIZ, v, q);
      }
    }
  }
}

// ═════════════ «Прислівники місця» ═════════════
function checkAdverbs(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Прислівники";
  // Форма спитана, якщо є питання цього слова, де вона — відповідь (прямий напрям) або стоїть у реченні (зворотний:
  // «за формою — питання»).
  if (FOCUS) return;
  const asked = new Set<string>();
  for (let i = 0; i < 3000; i++)
    for (const q of gen({})) {
      basic(r, QUIZ, q);
      const entry = q.comboId.split("::")[0];
      for (const a of ADVERBS)
        if (a.id === entry) for (const s of a.senses) if (q.correct === s.cz || (q.contextPhrase ?? "").toLowerCase().includes(s.cz.toLowerCase())) asked.add(`${a.id}|${s.cz}`);
    }
  for (const a of ADVERBS) {
    if (a.senses.length < 2) { exclude(r, `${QUIZ}: одна форма (rovně) — немає з чим протиставити`); continue; }
    for (const s of a.senses) if (!asked.has(`${a.id}|${s.cz}`)) gap(r, QUIZ, `${a.id}: «${s.cz}» (${s.label}) не питається`);
  }
}

// ═════════════ «Дата й час» ═════════════
function checkDateTime(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Дата й час";
  const ids = [
    ...DATE_ORDINALS.flatMap((d) => ["gen", "nom"].map((m) => `date-${d.day}::${m}::x`)),
    ...NOUNS.filter((n) => n.category === "days").flatMap((d) => [`weekday-when::${d.id}::x`, `weekday-name::${d.id}::x`]),
  ];
  for (const id of ids) {
    const qs = forced(gen, id);
    if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
    for (const q of qs) basic(r, QUIZ, q);
  }
  if (!FOCUS) for (let i = 0; i < 500; i++) for (const q of gen({})) basic(r, QUIZ, q);
}

// ─────────────── Запуск ───────────────
interface Gens {
  decl: Gen<DeclQuestion>;
  nouns: Gen<NounQuestion>;
  numerals: Gen<AnyQ & { blank: string }>;
  preps: Gen<AnyQ>;
  verbs: Gen<AnyQ>;
  adverbs: Gen<AnyQ>;
  datetime: Gen<AnyQ>;
}
const REAL: Gens = {
  decl: (s) => generateDeclensionSession(SESSION, undefined, s),
  nouns: (s) => generateNounSession(SESSION, undefined, s),
  numerals: (s) => generateNumeralAgreementSession(SESSION, undefined, s),
  preps: (s) => generatePrepositionSession(SESSION, undefined, s),
  verbs: (s) => generateVerbSession(SESSION, undefined, s),
  adverbs: (s) => generateAdverbSession(SESSION, undefined, s),
  datetime: (s) => generateDateTimeSession(SESSION, undefined, s),
};

function runAll(g: Gens, only?: (keyof Gens)[]): Report {
  const r = newReport();
  const on = (k: keyof Gens) => !only || only.includes(k);
  if (on("decl")) checkAdjPron(r, g.decl);
  if (on("nouns")) checkNouns(r, g.nouns);
  if (on("numerals")) checkNumerals(r, g.numerals);
  if (on("preps")) checkPrepositions(r, g.preps);
  if (on("verbs")) checkVerbs(r, g.verbs);
  if (on("adverbs")) checkAdverbs(r, g.adverbs);
  if (on("datetime")) checkDateTime(r, g.datetime);
  return r;
}

// Самоперевірка: кожна підкинута помилка мусить дати хоч одну ПОМИЛКУ, яку чистий прогін не дає.
function selfTest(): boolean {
  const mutate = <Q extends AnyQ>(gen: Gen<Q>, f: (q: Q) => Q | null): Gen<Q> => (s) => gen(s).map(f).filter((q): q is Q => q !== null);
  const swap = <Q extends AnyQ>(q: Q): Q => ({ ...q, correct: distractorOf(q) ?? q.correct });
  const cases: { name: string; only: (keyof Gens)[]; focus: string[]; gens: Partial<Gens> }[] = [
    { name: "зникла клітинка (velký чол. істот. орудний мн.)", only: ["decl"], focus: ["velky::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId === "velky::masc_anim_instrumental::pl" ? null : q)) } },
    { name: "хибна правильна відповідь у прикметника", only: ["decl"], focus: ["stary::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId.startsWith("stary::") ? swap(q) : q)) } },
    { name: "дійсна форма як дистрактор (pán: páni / pánové)", only: ["nouns"], focus: ["muz-pan::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId === "muz-pan::nominativ::pl" ? { ...q, options: [q.correct, q.correct === "páni" ? "pánové" : "páni"] } : q)) } },
    { name: "залишок «{s}» у фразі", only: ["nouns"], focus: ["stul::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId.startsWith("stul::") && q.contextPhrase ? { ...q, contextPhrase: `{s} ${q.contextPhrase}` } : q)) } },
    { name: "чужий власник у «чий?»", only: ["decl"], focus: ["jeho::", "jeji::owner", "jejich::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId.includes("::owner_") ? swap(q) : q)) } },
    { name: "особовий: форма іншого регістру", only: ["decl"], focus: ["pp-ja::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId === "pp-ja::x_genitiv::0" ? { ...q, correct: "mne", options: ["mne", distractorOf(q) ?? "mi"] } : q)) } },
    { name: "хибна вокалізація (ve → v)", only: ["decl"], focus: ["velky::", "vysoky::", "vsechen"], gens: { decl: mutate(REAL.decl, (q) => (q.contextPhrase && / ve ___/.test(q.contextPhrase) ? { ...q, contextPhrase: q.contextPhrase.replace(" ve ___", " v ___") } : q)) } },
    { name: "хибна правильна відповідь в іменника", only: ["nouns"], focus: ["stul::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId.startsWith("stul::") ? swap(q) : q)) } },
    { name: "зникло комбо прийменника (bez)", only: ["preps"], focus: ["prep-bez::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId.startsWith("prep-bez::") ? null : q)) } },
    { name: "числівник: зникла форма «pěti»", only: ["numerals"], focus: ["card-pet"], gens: { numerals: mutate(REAL.numerals, (q) => (q.correct === "pěti" ? null : q)) } },
    { name: "зникла форма дієслова", only: ["verbs"], focus: ["delat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "delat::past::ja" ? null : q)) } },
    { name: "дієслово: друга половина дублета (jsi se) як дистрактор", only: ["verbs"], focus: ["ucit-se::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "ucit-se::past::ty" ? { ...q, options: [q.correct, "učil jsi se"] } : q)) } },
    { name: "вид: хибна правильна відповідь (psát)", only: ["verbs"], focus: ["psat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "psat::aspect::x" ? swap(q) : q)) } },
    { name: "вид: доконаний інфінітив після фазового (vstávat)", only: ["verbs"], focus: ["vstavat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "vstavat::aspect::x" ? swap(q) : q)) } },
    { name: "вид: «a bude hotovo» для resultative: false (přijít)", only: ["verbs"], focus: ["prijit::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "prijit::aspect::x" ? { ...q, contextPhrase: "Zítra ___ a bude hotovo." } : q)) } },
  ];
  let ok = true;
  for (const t of cases) {
    FOCUS = t.focus;
    const base = runAll(REAL, t.only).errors.length;
    const r = runAll({ ...REAL, ...t.gens }, t.only);
    FOCUS = null;
    const caught = r.errors.length > base;
    console.log(`${caught ? "PASS" : "FAIL"}  ${t.name}${caught ? ` (+${r.errors.length - base} помилок)` : ""}`);
    if (!caught) ok = false;
  }
  return ok;
}

if (process.argv.includes("--self-test")) {
  process.exit(selfTest() ? 0 : 1);
} else {
  const only = process.argv.find((a: string) => a.startsWith("--only="))?.slice(7).split(",") as (keyof Gens)[] | undefined;
  const r = runAll(REAL, only);
  for (const [reason, n] of r.excluded) console.log(`ВИНЯТОК  ${reason}: ${n}`);
  for (const k of [...new Set(r.known)]) console.log(`ВІДОМО   ${k}`);
  for (const e of [...new Set(r.errors)]) console.log(`ПОМИЛКА  ${e}`);
  console.log(`\nПомилок: ${new Set(r.errors).size}, відомих дірок: ${new Set(r.known).size}`);
  process.exit(r.errors.length > 0 ? 1 : 0);
}
