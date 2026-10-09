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
//  3. Множина слів NO_PLURAL (utils/partnerSelection.ts: збірні — rodina, система, одна в місті, — metro): у квізі
//     «Іменники» їхня множина питається лише у фразах, чиє plOk містить їхній тег (інакше клітинку прибирає
//     NOUN_SKIP_RULES); у «Прийменниках», «Прикметниках та займенниках» і порядкових «Числівників» число обирає лише
//     candidateNumbers — для кожної фрази цих банків вона не дає таким словам множини без plOk. Межа: другий шлях
//     вибору числа в рушії в обхід candidateNumbers ця перевірка не побачить. Лічбу «Числівників» (metro не
//     рахується) тримає countable у рушії; тут не перевіряється.
//  4. Форми, яких мова не вживає (NOUN_USAGE_RULES у utils/partnerSelection.ts — спільні для всіх квізів: «ledny»,
//     «k patru»): у «Відмінках» їх прибирає NOUN_SKIP_RULES (перевірка 1); у «Прийменниках», «Прикметниках та
//     займенниках» і порядкових «Числівників» — для кожної фрази цих банків у ЇЇ відмінку candidateNumbers не дає числа,
//     форма якого під таким правилом (межа та сама, що в п. 3: другий шлях вибору числа не видно); лічба «Числівників»
//     вибирає іменник в обхід candidateNumbers, тому там перевіряються самі питання: форма іменника-відповіді не з
//     клітинки під правилом.
//  5. Відомі дірки (KNOWN) — заплановані, але ще не закриті роботи (roadmap). Друкуються окремо; закрив — прибери рядок.
//
//  6. Порядкові «Числівників»: клітинка без природної фрази, яку прибирає ORDINAL_BARE_SKIPS (множина від 7), друкується як
//     ВИНЯТОК із причиною; питання без речення для неї — ПОМИЛКА. Фрази без іменника (DeclFrame.standalone, гонки) мусять
//     з'являтись у кожного порядкового 2–12 у називному множини чол. істот.
//  7. Багатозначні іменники (поле senses): значення оракул будує сам із даних (senseViews), не через рушій. «Відмінки»:
//     клітинка питається, якщо її не прибирає хоч одне значення; підказка — переклад того значення, з чиїх тегів фраза
//     (у кожного слова, і однозначного: фраза — з фраз його тегів). «Прикметники та займенники»: фраза й тестоване слово
//     (fits) підходять одному значенню. Межа: у «Прийменниках» і «Числівниках» значення фрази окремо не звіряється
//     (там фразу й число обирає одна проєкція рушія; банки NO_PLURAL / NOUN_USAGE_RULES перевіряються для кожного значення).
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
import { acceptedForms, candidateNumbers, hasNumber, matchesFilter, matchesNeeds, NO_PLURAL, NOUN_USAGE_RULES, vocalDecision } from "../src/utils/partnerSelection";
import { skipReason, SkipRule } from "../src/utils/quizCommon";
import { NOUN_FRAMES, NOUN_SKIP_RULES } from "../src/data/nounFrames";
import { ANTECEDENT_FRAME, FEAR_ANTECEDENT_FRAME, DECL_CELL_SKIPS, DECL_FRAMES, DECL_WORD_SKIPS, OWNER_FRAME, QUIZ_CASES, QuizCase, ValueCell } from "../src/data/declensionFrames";
import { DUAL_FRAMES, EXCHANGE_FRAMES, FIXED_FRAMES } from "../src/data/prepositionPartners";
import { ORDINAL_BARE_SKIPS, ORDINAL_FRAMES } from "../src/data/numeralFrames";
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
import { INTERROGATIVE_ADVERBS } from "../src/data/interrogativeAdverbs";
import { DAY_PARTS, TIME_SKIP_RULES } from "../src/data/timeforms";
import { PREPOSITIONS } from "../src/data/prepositions";
import { CARDINALS } from "../src/data/cardinals";
import { DATE_ORDINALS } from "../src/data/dates";
import { NOUN_CATS_EXCLUDED_FROM_QUIZ } from "../src/data/categories";
import { adjQuizUsable } from "../src/data/adjectiveCategories";
import { AdverbSense, CASE_ORDER, CzechCase, FullDeclension, Gender, GENDER_ORDER, GrammaticalNumber, NounEntry, NounFilter, NUMBER_ORDER, PERSON_ORDER, PronounEntry, PronounQuiz, QuizNoun, VerbEntry } from "../src/types";

// ─────────────── Значення багатозначних іменників (незалежно від рушія) ───────────────
// Значення слова оракул будує сам із ДАНИХ (поле senses, types/index.ts), а не через nounSenses рушія: інакше помилка
// в проєкції (напр. злиті теги двох значень) зіпсувала б і перевірку. Підказка значення в квізі — «переклад (підпис)».
const SENSE_VIEWS = new Map<string, QuizNoun[]>();
function senseViews(n: NounEntry): QuizNoun[] {
  if (!n.senses) return [n];
  let v = SENSE_VIEWS.get(n.id);
  if (!v) {
    v = n.senses.map((s) => ({ ...n, senses: undefined, sem: s.sem, uncountable: s.uncountable, uk: `${s.uk ?? n.uk} (${s.label})` }));
    SENSE_VIEWS.set(n.id, v);
  }
  return v;
}

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
  promptWord?: string;
  promptUk?: string;
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
  if (/(bojím|bojíš|nebojím|ptám|jsem|jsi|vejdu|nevejdu|ti|mi|sis|napiješ|nenapiju|dotkl) se ___/i.test(q.contextPhrase ?? "")) return;
  const prep = m[1].toLowerCase()[0] as VocalPrep;
  const used = m[1].length === 2 ? "vocal" : "plain";
  for (const o of q.options) if (vocalDecision(prep, o) !== used) r.errors.push(`${quiz}: ${q.comboId}: вокалізація «${m[1]}» не підходить до «${o}» — «${q.contextPhrase}»`);
}

// ═════════════ «Прикметники та займенники» ═════════════
interface Tested {
  id: string;
  decl: FullDeclension;
  quiz: PronounQuiz;
  value?: number; // порядковий: число, яке слово називає
  bareSkips?: SkipRule<ValueCell>[]; // порядковий: клітинки без природної фрази, яких без речення не питаємо (ORDINAL_BARE_SKIPS)
}
const ADJ_QUIZ = "Прикметники та займенники";

function testedWords(r: Report): Tested[] {
  const out: Tested[] = [];
  for (const a of ADJECTIVES) {
    if (!adjQuizUsable(a.category)) continue; // порядкові — квіз «Числівники» (checkOrdinals)
    out.push({ id: a.id, decl: a.declension, quiz: {} });
    if (!a.degrees) continue;
    let why: string | null = null; // свідомий виняток — одне правило з data/declensionFrames.ts, один раз на слово
    for (const [d, suffix] of [["comparative", "__comp"], ["superlative", "__super"]] as const) {
      const skip = skipReason(DECL_WORD_SKIPS, { kind: "adjective", adjective: a, degree: d });
      if (skip) why = skip;
      else out.push({ id: `${a.id}${suffix}`, decl: a.degrees[d].declension, quiz: {} });
    }
    if (why) exclude(r, `${ADJ_QUIZ}: ${why}`);
  }
  for (const p of [...PRONOUNS, ...INTERROGATIVE_ADJ, ...INDEFINITE_ADJ] as PronounEntry[]) {
    if (!p.declinable) {
      exclude(r, `${ADJ_QUIZ}: незмінне слово — відмінювати нічого (jeho, jejich; їх тренує «чий?»)`);
      continue;
    }
    const why = skipReason(DECL_WORD_SKIPS, { kind: "pronoun", pronoun: p });
    if (why) {
      exclude(r, `${ADJ_QUIZ}: ${why}`);
      continue;
    }
    out.push({ id: p.id, decl: p.declension, quiz: p.quiz ?? {} });
  }
  return out;
}

// Клітинку квіз питає, якщо жодне свідоме правило (data/declensionFrames.ts) її не прибирає; причину друкуємо.
function cellExists(r: Report, t: Tested, g: Gender, c: QuizCase, n: GrammaticalNumber): boolean {
  const why = skipReason(DECL_CELL_SKIPS, { quiz: t.quiz, g, c, n });
  if (why) return exclude(r, `${ADJ_QUIZ}: ${why}`), false;
  return true;
}

// Слово з таблицею прикметника: кожна клітинка рід × відмінок × число питається, правильна — з клітинки,
// дистрактор — не її форма. Спільне для «Прикметників та займенників» і порядкових у «Числівниках».
function checkTableCells<Q extends AnyQ>(r: Report, quiz: string, t: Tested, gen: Gen<Q>): void {
  const all = GENDER_ORDER.flatMap((g) => QUIZ_CASES.flatMap((c) => NUMBER_ORDER.map((n) => split(t.decl[g][c][n]))));
  for (const g of GENDER_ORDER)
    for (const c of QUIZ_CASES)
      for (const n of NUMBER_ORDER) {
        const target = split(t.decl[g][c][n]);
        if (target.length === 0 || !cellExists(r, t, g, c, n)) continue;
        if (!all.some((f) => f.length > 0 && f.every((x) => !target.includes(x)))) {
          exclude(r, `${quiz}: усі форми слова однакові — дистрактора немає`);
          continue;
        }
        const id = `${t.id}::${g}_${c}::${n}`;
        const qs = forced(gen, id);
        // свідомий виняток порядкових: клітинка без природної фрази без речення не питається (з причиною)
        const bareWhy = t.bareSkips && t.value !== undefined ? skipReason(t.bareSkips, { value: t.value, g, c: c as QuizCase, n }) : null;
        if (qs.length === 0) bareWhy ? exclude(r, `${quiz}: ${bareWhy}`) : gap(r, quiz, `${id} не питається`);
        for (const q of qs) {
          if (bareWhy && !q.contextPhrase) r.errors.push(`${quiz}: ${id}: питається без речення, хоч правило її прибирає — ${bareWhy}`);
          basic(r, quiz, q);
          vocal(r, quiz, q);
          if (!target.includes(q.correct)) r.errors.push(`${quiz}: ${id}: правильна «${q.correct}» не з клітинки (${target.join(" / ")})`);
          const d = distractorOf(q);
          if (d && target.includes(d)) r.errors.push(`${quiz}: ${id}: дистрактор «${d}» — теж правильна форма`);
        }
      }
}

function checkAdjPron(r: Report, gen: Gen<DeclQuestion>): void {
  for (const t of testedWords(r)) checkTableCells(r, ADJ_QUIZ, t, gen);
  checkPersonal(r, gen);
  checkCore(r, gen);
  checkPossessive(r, gen);
  checkDeclSenses(r, gen);
}

// Багатозначний іменник у фразі квізу (kuře — тварина / їжа): фраза й тестоване слово (його fits) підходять ОДНОМУ
// значенню — не «Hraju si s teplým kuřetem» (фраза тварини, прикметник їжі). Фразу впізнаємо за шаблоном DECL_FRAMES
// (останнє речення питання — перше може бути реченням-антецедентом «Znáš…?»); невпізнана фраза з таким словом — теж
// помилка (перевірка не мовчить). Межа: слова-партнери (займенник перед прикметником) тут не перевіряються.
const MULTI_SENSE = NOUNS.filter((n) => n.senses);
const declFrameRe = (text: string) =>
  new RegExp(`^${escapeRe(text).replace("___", "(?:\\S+ )?___(?: \\S+)*").replace("\\{N\\}", "\\S+(?: \\S+)*").replace(/\\\{[vksz]\\\}/g, "\\S+")}$`);
function testedFits(comboId: string): NounFilter | null {
  const id = comboId.split("::")[0].replace(/__(comp|super)$/, "");
  const a = ADJECTIVES.find((x) => x.id === id);
  if (a) return a.fits;
  const p = ([...PRONOUNS, ...INTERROGATIVE_ADJ, ...INDEFINITE_ADJ] as PronounEntry[]).find((x) => x.id === id);
  return p ? (p.quiz?.fits ?? {}) : null; // особові займенники (pp-…) іменника-партнера не мають
}
function checkDeclSenses(r: Report, gen: Gen<DeclQuestion>): void {
  if (MULTI_SENSE.length === 0) return;
  const frames = Object.values(DECL_FRAMES).flat();
  for (let i = 0; i < 1500; i++)
    for (const q of gen({})) {
      if (!q.contextPhrase) continue;
      const fits = testedFits(q.comboId);
      if (!fits) continue;
      const last = q.contextPhrase.split(/(?<=\?) /).pop()!;
      const words = new Set(last.replace(/[.?!,]/g, "").split(" "));
      for (const n of MULTI_SENSE) {
        if (!CASE_ORDER.some((c) => NUMBER_ORDER.some((num) => acceptedForms(n, c, num).some((f) => words.has(f))))) continue;
        const matched = frames.filter((f) => declFrameRe(f.text).test(last));
        if (matched.length === 0) r.errors.push(`${ADJ_QUIZ}: ${q.comboId}: фразу «${q.contextPhrase}» зі словом ${n.cz} не впізнано серед DECL_FRAMES`);
        else if (!senseViews(n).some((v) => matchesFilter(v, fits) && matched.some((f) => matchesFilter(v, f))))
          r.errors.push(`${ADJ_QUIZ}: ${q.comboId}: «${q.contextPhrase}» — фраза й слово з різних значень ${n.cz}`);
      }
    }
}

// Особові: [без прийм., після прийм., наголошена] з даних PERSONAL_QUIZ_FORMS (3-тя особа) і з таблиць картки (1–2 особа,
// my, vy, se). Дублети картки поза цими формами (jej, něj, ono «je») — прийнятні варіанти, окремо не питаються.
function checkPersonal(r: Report, gen: Gen<DeclQuestion>): void {
  const PP_CASES = QUIZ_CASES.filter((c) => c !== "nominativ");
  const expect: { id: string; form: string; sameCase: string[]; stressed: boolean }[] = [];
  for (const e of PERSONAL_PRONOUNS) {
    if (e.gendered) {
      const tables = e.number === "pl" ? [{ part: "pl", t: PERSONAL_QUIZ_FORMS.pl }] : (["masc_anim", "fem", "neut"] as const).map((g) => ({ part: g, t: PERSONAL_QUIZ_FORMS.sg[g] }));
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
          for (const nn of NUMBER_ORDER)
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
    const senses = senseViews(n);
    const pt = n.declension.nominativ.sg === "—";
    for (const c of CASE_ORDER)
      for (const num of NUMBER_ORDER) {
        if (split(n.declension[c][num]).length === 0) continue;
        if (NOUN_CATS_EXCLUDED_FROM_QUIZ.has(n.category)) { exclude(r, `${QUIZ}: категорія ${n.category} — тренує інший квіз`); continue; }
        if (c === "nominativ" && (num === "sg" || pt)) { exclude(r, `${QUIZ}: заголовок картки`); continue; }
        // Клітинку не питає жодне значення слова — свідомий виняток; інакше її мусить питати квіз.
        const whys = senses.map((v) => skipReason(NOUN_SKIP_RULES, { noun: v, c, n: num }));
        if (whys.every(Boolean)) { exclude(r, `${QUIZ}: ${whys[0]}`); continue; }
        const asking = senses.filter((_, i) => !whys[i]);
        const id = `${n.id}::${c}::${num}`;
        const qs = forced(gen, id);
        if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
        const acc = acceptedForms(n, c, num);
        for (const q of qs) {
          basic(r, QUIZ, q);
          if (!acc.includes(q.correct)) r.errors.push(`${QUIZ}: ${id}: правильна «${q.correct}» не з клітинки`);
          const d = distractorOf(q);
          if (d && acc.includes(d)) r.errors.push(`${QUIZ}: ${id}: дистрактор «${d}» — прийнятна форма клітинки`);
          nounSense(r, QUIZ, id, n, asking, c, q);
        }
      }
  }
}

// Фраза й підказка з ОДНОГО значення слова: підказка — переклад значення, для якого клітинку питаємо, і фраза — фраза
// квізу, чиї теги підходять саме цьому значенню (у однозначного слова — тегам слова). Питання без речення показує
// переклад-заголовок слова.
function nounSense(r: Report, QUIZ: string, id: string, n: NounEntry, asking: readonly QuizNoun[], c: CzechCase, q: NounQuestion): void {
  if (!q.contextPhrase) {
    if (q.promptUk !== n.uk) r.errors.push(`${QUIZ}: ${id}: питання без речення з підказкою «${q.promptUk}», а не перекладом слова «${n.uk}»`);
    return;
  }
  const sense = asking.find((v) => v.uk === q.promptUk);
  if (!sense) return void r.errors.push(`${QUIZ}: ${id}: підказка «${q.promptUk}» — не переклад значення, у якому клітинку питаємо`);
  if (!NOUN_FRAMES[c].some((f) => frameRe(f.text).test(q.contextPhrase!) && matchesNeeds(sense, f)))
    r.errors.push(`${QUIZ}: ${id}: фраза «${q.contextPhrase}» не з фраз значення «${q.promptUk}» (теги ${sense.sem.join(", ")})`);
}

// ═════════════ Множина слів NO_PLURAL (rodina, metro) ═════════════
// Самоперевірка підміняє вибір числа (NUMBERS_OF), щоб показати, що перевірка банків ловить множину без plOk.
let NUMBERS_OF: typeof candidateNumbers = candidateNumbers;
const noPluralTags = (n: QuizNoun) => n.sem.filter((t) => NO_PLURAL.includes(t));
const escapeRe = (s: string) => s.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
// Фраза квізу «Іменники» з {v}{k}{s}{z} → шаблон, що приймає і вокалізований прийменник.
const frameRe = (text: string) => new RegExp(`^${escapeRe(text).replace(/\\\{[vksz]\\\}/g, "\\S+")}$`);

function checkNoPluralNouns(r: Report, gen: Gen<NounQuestion>): void {
  const QUIZ = "Іменники";
  for (const n of NOUNS) {
    // Значення без такого тегу законно дає множину — тоді її перевіряє nounSense (фраза з тегів цього значення).
    const senses = senseViews(n);
    if (senses.some((v) => noPluralTags(v).length === 0) || !hasNumber(n, "sg") || NOUN_CATS_EXCLUDED_FROM_QUIZ.has(n.category)) continue;
    const tags = [...new Set(senses.flatMap(noPluralTags))];
    for (const c of CASE_ORDER) {
      if (split(n.declension[c].pl).length === 0 || senses.every((v) => skipReason(NOUN_SKIP_RULES, { noun: v, c, n: "pl" }))) continue;
      const ok = NOUN_FRAMES[c].filter((f) => f.plOk?.some((t) => tags.includes(t))).map((f) => frameRe(f.text));
      const id = `${n.id}::${c}::pl`;
      for (const q of forced(gen, id))
        if (!q.contextPhrase || !ok.some((re) => re.test(q.contextPhrase!)))
          r.errors.push(`${QUIZ}: ${id}: множина слова з ${tags.join(", ")} не у фразі з plOk — «${q.contextPhrase ?? "без речення"}»`);
    }
  }
}

// Фрази квізів, де іменник — слово-партнер, разом із відмінком, у якому він стоїть у фразі.
type CarrierFrame = { quiz: string; c: CzechCase; f: { text: string; num?: "sg" | "pl" | "any"; plOk?: NounEntry["sem"] } };
function carrierFrames(): CarrierFrame[] {
  const out: CarrierFrame[] = [];
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") for (const f of FIXED_FRAMES[p.id] ?? []) out.push({ quiz: "Прийменники", c: p.govCase, f });
    else if (p.dual) {
      for (const f of DUAL_FRAMES[p.id]?.motion ?? []) out.push({ quiz: "Прийменники", c: p.dual.motion.govCase, f });
      for (const f of DUAL_FRAMES[p.id]?.location ?? []) out.push({ quiz: "Прийменники", c: p.dual.location.govCase, f });
      if (p.dual.exchange) for (const f of EXCHANGE_FRAMES) out.push({ quiz: "Прийменники", c: p.dual.exchange.govCase, f });
    }
  }
  for (const [c, fs] of Object.entries(DECL_FRAMES)) for (const f of fs) out.push({ quiz: ADJ_QUIZ, c: c as CzechCase, f });
  for (const f of [ANTECEDENT_FRAME, FEAR_ANTECEDENT_FRAME, OWNER_FRAME]) out.push({ quiz: ADJ_QUIZ, c: "akuzativ", f });
  // фраза без іменника (standalone) іменника-партнера не має — перевіряти її проти слів нічого
  for (const [c, fs] of Object.entries(ORDINAL_FRAMES)) for (const f of fs) if (!f.standalone) out.push({ quiz: "Числівники (порядкові)", c: c as CzechCase, f });
  return out;
}

function checkNoPluralBanks(r: Report): void {
  const banks = carrierFrames();
  for (const n of NOUNS.flatMap(senseViews)) {
    const tags = noPluralTags(n);
    if (tags.length === 0 || !hasNumber(n, "sg") || !hasNumber(n, "pl")) continue;
    for (const { quiz, c, f } of banks) {
      if (f.plOk?.some((t) => tags.includes(t))) continue;
      const pl = [0, 0.99].some((x) => NUMBERS_OF(n, c, f.num ?? "sg", () => x, f.plOk).includes("pl"));
      if (pl) r.errors.push(`${quiz}: ${n.id} (${tags.join(", ")}) у множині у фразі «${f.text}» без plOk`);
    }
  }
}

// ═════════════ Форми, яких мова не вживає (NOUN_USAGE_RULES) ═════════════
// Банки фраз: число, яке candidateNumbers дає слову у відмінку фрази, — не під правилом (теги фрази не звужують
// перевірку: так нове слово чи тег не проскочить і в майбутній фразі).
function checkUsageBanks(r: Report): void {
  const banks = carrierFrames();
  for (const n of NOUNS.flatMap(senseViews))
    for (const { quiz, c, f } of banks)
      for (const x of [0, 0.99])
        for (const num of NUMBERS_OF(n, c, f.num ?? "sg", () => x, f.plOk)) {
          const why = skipReason(NOUN_USAGE_RULES, { noun: n, c, n: num });
          if (why) r.errors.push(`${quiz}: ${n.id} ${c} ${num} у фразі «${f.text}» — ${why}`);
        }
}
// Лічба «Числівників» обирає іменник в обхід candidateNumbers — перевіряємо самі питання з пропуском на іменнику:
// відповідь — форма клітинки, яку мова вживає (якщо форма є і в дозволеній клітинці, питання не помилкове).
function checkUsageNumerals(r: Report, gen: Gen<AnyQ & { blank?: string }>): void {
  for (let i = 0; i < 1500; i++)
    for (const q of gen({})) {
      if (q.blank !== "noun") continue;
      const cells = NOUNS.filter((n) => n.cz === q.promptWord).flatMap(senseViews).flatMap((n) =>
        CASE_ORDER.flatMap((c) => NUMBER_ORDER.filter((num) => acceptedForms(n, c, num).includes(q.correct)).map((num) => ({ noun: n, c, n: num })))
      );
      const used = cells.filter((x) => !skipReason(NOUN_USAGE_RULES, x));
      if (cells.length > 0 && used.length === 0)
        r.errors.push(`Числівники: ${q.comboId}: «${q.correct}» (${q.promptWord}) — ${skipReason(NOUN_USAGE_RULES, cells[0])}`);
    }
}

// ═════════════ «Числівники» ═════════════
function checkNumerals(r: Report, gen: Gen<AnyQ & { blank?: string }>): void {
  const QUIZ = "Числівники";
  const cases = QUIZ_CASES;
  for (const cd of CARDINALS) {
    for (const c of cases) {
      const id = `${cd.id}::${c}::x`;
      const asked = new Set<string>();
      const qs: (AnyQ & { blank?: string })[] = [];
      const forms = new Set<string>();
      if (cd.kind === "gendered") for (const g of GENDER_ORDER) forms.add(split(cd.declension[g][c].sg)[0]);
      else if (cd.kind === "twoForm") { forms.add(split(cd.forms[c].masc)[0]); forms.add(split(cd.forms[c].femNeut)[0]); }
      else if (cd.kind === "invariantDecl") forms.add(split(cd.forms[c])[0]);
      else forms.add(split(c === "nominativ" || c === "akuzativ" ? cd.direct : cd.oblique)[0]);
      // рід іменника й пропуск обираються навмання (середній рід — ~3 % питань комбо): 40 вибірок, далі — доки не
      // трапляться всі чотири роди іменника І кожна форма числівника як відповідь (до 400), щоб рідкісний рід
      // (jedno — середній) не давав випадкової «дірки»
      const nounGenders = () => new Set(qs.filter((q) => q.blank === "noun").map((q) => q.taskText.split(":")[1]?.split(",")[0]?.trim()));
      const formsSeen = () => [...forms].every((f) => !f || qs.some((q) => q.blank === "numeral" && q.correct === f));
      for (let i = 0; i < 400 && (i < 40 || (qs.length > 0 && (nounGenders().size < GENDER_ORDER.length || !formsSeen()))); i++) qs.push(...forced(gen, id));
      if (qs.length === 0) { gap(r, QUIZ, `${id} не питається`); continue; }
      for (const q of qs) { basic(r, QUIZ, q); if (q.blank === "numeral") asked.add(q.correct); }
      for (const f of forms) if (f && !asked.has(f)) gap(r, QUIZ, `${cd.id} ${c}: форма «${f}» не питається`);
      {
        // кожен рід іменника — у кожного числівника (не лише в родових jeden / dva): «se čtyřmi bratry» теж
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
        // пропуск — числівник чи іменник, навмання: 40 вибірок, далі — доки форма не трапиться відповіддю (до 400)
        for (let i = 0; i < 400 && (i < 40 || (qs.length > 0 && !qs.some((q) => q.correct === f))); i++) qs.push(...forced(gen, `${cd.id}::${c}::pt`));
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
  // складені: рід іменника — у кожній групі останньої цифри (dvacet jeden / jedna / jedno, dvacet dva / dvě)
  const GENDER_LABELS = ["чол. іст.", "чол. неіст.", "жін.", "сер."];
  const genderOf = (q: AnyQ & { blank?: string }) => (q.blank === "noun" ? GENDER_LABELS.find((l) => q.taskText.includes(`: ${l},`)) : undefined);
  for (const g of [1, 2, 3, 4, 5]) {
    const qs: (AnyQ & { blank?: string })[] = [];
    for (let i = 0; i < 400 && (i < 3 || (qs.length > 0 && new Set(qs.map(genderOf).filter(Boolean)).size < GENDER_LABELS.length)); i++) qs.push(...forced(gen, `compound-${g}`));
    if (qs.length === 0) gap(r, QUIZ, `складені на …${g} не питаються`);
    for (const q of qs) basic(r, QUIZ, q);
    const seen = new Set(qs.map(genderOf));
    for (const l of GENDER_LABELS) if (qs.length > 0 && !seen.has(l)) gap(r, QUIZ, `складені на …${g}: іменник роду «${l}» не питається`);
  }
  // порядкові (první … dvanáctý): таблиця прикметника, кожна клітинка (рішення Ніка 2026-10-06)
  for (const a of ADJECTIVES.filter((x) => x.category === "ordinal")) checkTableCells(r, QUIZ, { id: a.id, decl: a.declension, quiz: {}, value: a.value, bareSkips: ORDINAL_BARE_SKIPS }, gen);
  // фрази без іменника (гонки: «Dojeli jsme druzí»): кожне число 2–12 у називному множини чол. істот. справді дає такі питання
  const alone = Object.values(ORDINAL_FRAMES).flat().filter((f) => f.standalone);
  for (const a of ADJECTIVES.filter((x) => x.category === "ordinal" && (x.value ?? 0) > 1)) {
    const id = `${a.id}::masc_anim_nominativ::pl`;
    const texts = new Set(forcedN(gen, id, 80).map((q) => q.contextPhrase ?? ""));
    for (const f of alone) if (!texts.has(f.text)) gap(r, QUIZ, `${id}: фраза без іменника «${f.text}» не з'явилась`);
  }
}

// ═════════════ «Прийменники» ═════════════
function checkPrepositions(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Прийменники";
  const numbersOf = (qs: AnyQ[]) => new Set<string>(qs.map((q) => (/множина/.test(q.taskText) ? "мн." : /однина/.test(q.taskText) ? "одн." : "")));
  const need = (id: string, both: boolean) => {
    const qs: AnyQ[] = [];
    // обидва числа: число обирається навмання (множина буває й у ~8 % питань комбо) — більше вибірок, далі — доки не
    // трапляться обидва числа (до 400), щоб рідкісне число не давало випадкової «дірки»
    for (let i = 0; i < 400 && (i < (both ? 60 : 20) || (both && qs.length > 0 && !["одн.", "мн."].every((n) => numbersOf(qs).has(n)))); i++) qs.push(...forced(gen, id));
    if (qs.length === 0) return gap(r, QUIZ, `${id} не питається`);
    for (const q of qs) basic(r, QUIZ, q);
    if (both) for (const n of ["одн.", "мн."]) if (!numbersOf(qs).has(n)) gap(r, QUIZ, `${id} ${n} не питається`);
  };
  for (const p of PREPOSITIONS) {
    if (p.type === "fixed") {
      const one = ONE_NUMBER_FIXED.find((x) => x.prep === p.id);
      if (one) exclude(r, `${QUIZ}: ${one.reason}`);
      need(`${p.id}::fixnoun::${p.govCase}`, !one);
      if (PREPOSITIONS.some((o) => o !== p && o.type === "fixed" && o.govCase === p.govCase)) need(`${p.id}::fixprep::${p.govCase}`, false);
      else exclude(r, `${QUIZ}: вибір прийменника — немає іншого з тим самим відмінком`);
    } else if (p.dual) {
      for (const [side, gc] of [["motion", p.dual.motion.govCase], ["location", p.dual.location.govCase]] as const) {
        const one = ONE_NUMBER_DUAL.find((x) => x.prep === p.id && (x.side === side || x.side === "both"));
        if (one) exclude(r, `${QUIZ}: ${one.reason}`);
        need(`${p.id}::dual-${side}::${gc}`, !one);
      }
      if (p.dual.exchange) need(`${p.id}::za-exchange::${p.dual.exchange.govCase}`, true);
    }
  }
}
// Форма іменника після прийменника питається в ОБОХ числах; виняток — лише значення, де природне одне число
// (закритий список). Вибір самого прийменника (fixprep) — про прийменник, число іменника там не перевіряємо.
// (Порожній: mimo — «mimo velká města», při — «při cestách» мають і множину.)
const ONE_NUMBER_FIXED: { prep: string; reason: string }[] = [];
const ONE_NUMBER_DUAL: { prep: string; side: "motion" | "location" | "both"; reason: string }[] = [
  { prep: "prep-mezi", side: "both", reason: "mezi — лише множина (між двома й більше)" },
];

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
// Ролі форм — з даних (asks), питальні слова — з data/interrogativeAdverbs.ts. Обов'язково: кожна форма з питанням —
// прямим питанням (якщо в слова є форма з іншою роллю), кожна форма з ОДНИМ питанням — ще й зворотним.
function checkAdverbs(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = "Прислівники";
  const qWord = (role: string) => INTERROGATIVE_ADVERBS.find((x) => x.role === role);
  const roles = (s: AdverbSense): readonly string[] => s.asks;
  for (const a of ADVERBS) {
    for (const s of a.senses) {
      const rs = roles(s);
      if (rs.length === 0) { exclude(r, `${QUIZ}: форма без питання (${s.cz}) — лише напрямок`); continue; }
      const others = a.senses.filter((o) => o !== s && !roles(o).some((x) => rs.includes(x)));
      // прямий: за підказкою ролі — форма; дистрактор — інша форма слова з іншою роллю
      const fid = `${a.id}::${rs[0]}::x`;
      if (others.length === 0) exclude(r, `${QUIZ}: одна форма (${s.cz}) — немає з чим протиставити`);
      else {
        const qs = forced(gen, fid);
        if (inFocus(fid) && qs.length === 0) gap(r, QUIZ, `${fid}: «${s.cz}» (${rs.join("+")}) не питається прямим питанням`);
        for (const q of qs) {
          basic(r, QUIZ, q);
          const bad = (m: string) => r.errors.push(`${QUIZ}: ${q.comboId}: ${m} — «${q.contextPhrase}» [${q.options.join(" / ")}]`);
          if (q.correct !== s.cz) bad(`правильна не «${s.cz}»`);
          const d = distractorOf(q);
          if (!others.some((o) => o.cz === d)) bad("дистрактор не форма цього слова з іншою роллю");
          const filled = (q.contextPhrase ?? "").replace("___", s.cz).toLowerCase();
          if (!s.examples.some((ex) => ex.cz.toLowerCase() === filled)) bad("пропуск не на місці форми в прикладі");
          for (const x of rs) if (!q.taskText.toLowerCase().includes((qWord(x)?.uk ?? "?").split(" / ")[0])) bad(`підказка без питання ролі ${x}`);
        }
      }
      // зворотний: за реченням — питальне слово
      const rid = `${a.id}::${rs[0]}::rev`;
      if (rs.length > 1) { exclude(r, `${QUIZ}: форма на два питання (${s.cz}) — зворотне питання мало б дві правильні відповіді`); continue; }
      const qs = forced(gen, rid);
      if (inFocus(rid) && qs.length === 0) gap(r, QUIZ, `${rid}: «${s.cz}» (${rs[0]}) не питається зворотним питанням`);
      for (const q of qs) {
        basic(r, QUIZ, q);
        const bad = (m: string) => r.errors.push(`${QUIZ}: ${q.comboId}: ${m} — «${q.contextPhrase}» [${q.options.join(" / ")}]`);
        if (q.correct !== qWord(rs[0])?.cz) bad(`правильна не «${qWord(rs[0])?.cz}»`);
        if (!INTERROGATIVE_ADVERBS.some((x) => x.cz === distractorOf(q))) bad("дистрактор не питальне слово");
        if (!s.examples.some((ex) => ex.cz === q.contextPhrase)) bad("речення не приклад цієї форми");
        if (!(q.contextPhrase ?? "").toLowerCase().split(/[^\p{L}]+/u).includes(s.cz.toLowerCase())) bad("у реченні немає самої форми");
      }
    }
  }
}

// ═════════════ «Дата й час» ═════════════
// Незалежне від рушія й від data/timeforms.ts читання часу: правила граматики записані тут удруге (mozaika.eu «Kolik je
// hodin?», czechonline.org, IJP), числівники — з таблиць словника.
const DT_QUIZ = "Дата й час";
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const UK_MONTH_GEN = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const ORACLE_PARTS = [
  { phrase: "ráno", from: 6 },
  { phrase: "dopoledne", from: 9 },
  { phrase: "odpoledne", from: 12 },
  { phrase: "večer", from: 18 },
  { phrase: "v noci", from: 22 },
];
function femCard(v: number, c: "nominativ" | "akuzativ" | "genitiv"): string {
  const k = CARDINALS.find((x) => x.value === v)!;
  const cell = k.kind === "gendered" ? k.declension.fem[c].sg : k.kind === "twoForm" ? k.forms[c].femNeut : k.kind === "invariantDecl" ? k.forms[c] : c === "genitiv" ? k.oblique : k.direct;
  return split(cell)[0];
}
const hoursWord = (n: number, c: "nominativ" | "akuzativ") => (n === 1 ? (c === "nominativ" ? "hodina" : "hodinu") : n <= 4 ? "hodiny" : "hodin");
function oPlain(n: number): string {
  if (n === 0) return "nula";
  if (n < 20 || n % 10 === 0) return femCard(n, "nominativ");
  const u = n % 10;
  return `${femCard(n - u, "nominativ")} ${u === 1 ? "jedna" : u === 2 ? "dva" : femCard(u, "nominativ")}`;
}
function oHalf(nh: number): string {
  if (nh === 1) return "jedné";
  const ord = ADJECTIVES.find((a) => a.category === "ordinal" && a.value === nh);
  return split(ord?.declension.fem.genitiv.sg)[0];
}
// Розмовне читання (без Je/Jsou) у називному або знахідному (після v).
function oColloquial(h24: number, m: number, c: "nominativ" | "akuzativ" = "nominativ"): string | null {
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const nh = h === 12 ? 1 : h + 1;
  const whole = (n: number) => `${femCard(n, c)} ${hoursWord(n, c)}`;
  // перед цілою годиною «za pět minut dvě» — без hodiny (mozaika.eu, «Kolik je hodin?», 2022)
  const at: Record<number, string> = { 0: whole(h), 15: `čtvrt na ${femCard(nh, "akuzativ")}`, 30: `půl ${oHalf(nh)}`, 45: `tři čtvrtě na ${femCard(nh, "akuzativ")}`, 60: femCard(nh, "nominativ") };
  if (m in at && m < 60) return at[m];
  if (c === "akuzativ") return null;
  for (const a of [15, 30, 45, 60]) if (a - m === 5 || a - m === 10) return `za ${a - m === 5 ? "pět" : "deset"} minut ${at[a]}`;
  return null;
}
// mozaika.eu: «Je sedmnáct (hodin)», «Je jedna dvacet», «Je sedmnáct hodin pět minut»; 0:xx — лише розмовне (null).
function oFormal(h: number, m: number): string | null {
  if (h === 0) return null;
  const hours = h >= 20 ? `${oPlain(h)} hodin` : `${femCard(h, "nominativ")} ${hoursWord(h, "nominativ")}`;
  if (m === 0) return hours;
  if (m < 10) return h < 5 ? null : `${hours} ${femCard(m, "nominativ")} ${m === 1 ? "minuta" : m <= 4 ? "minuty" : "minut"}`;
  return `${oPlain(h)} ${oPlain(m)}`;
}
const oSentence = (h24: number, m: number, sys: "formal" | "colloquial") => {
  const raw = sys === "formal" ? oFormal(h24, m) : oColloquial(h24, m);
  const n = sys === "formal" ? h24 : h24 % 12 === 0 ? 12 : h24 % 12;
  return raw && `${m === 0 && n >= 2 && n <= 4 ? "Jsou" : "Je"} ${raw}`;
};
// ve — якщо перше слово починається двома приголосними (mozaika.eu: «Ve dvě. Ve tři.»; ve středu, ve čtvrtek).
const oVe = (group: string) => (/^[^aáeéěiíoóuúůyý\s]{2}/i.test(group) ? `ve ${group}` : `v ${group}`);
const oWrongVe = (group: string) => (oVe(group).startsWith("ve ") ? `v ${group}` : `ve ${group}`);
const partIndex = (h: number) => { let i = ORACLE_PARTS.length - 1; ORACLE_PARTS.forEach((p, j) => { if (h >= p.from) i = j; }); return i; };

function forcedN<Q extends AnyQ>(gen: Gen<Q>, id: string, n: number): Q[] {
  const out: Q[] = [];
  if (!inFocus(id)) return out;
  for (let i = 0; i < n; i++) out.push(...gen({ [id]: 1 }).filter((q) => q.comboId === id));
  return out;
}

function checkDateTime(r: Report, gen: Gen<AnyQ>): void {
  const QUIZ = DT_QUIZ;
  const bad = (q: AnyQ, m: string) => r.errors.push(`${QUIZ}: ${q.comboId}: ${m} — «${q.contextPhrase ?? ""}» [${q.options.join(" / ")}]`);
  const months = NOUNS.filter((n) => n.month);
  if (months.length !== 12 || months.some((n) => n.month!.maxDay !== DAYS_IN_MONTH[n.month!.num - 1]))
    r.errors.push(`${QUIZ}: ДАНІ — місяці словника (поле month) не 12 або хибний найбільший день`);

  // ── Дати: кожен день × родовий / називний × кожен дублет як правильна відповідь
  for (const d of DATE_ORDINALS) {
    const ord = ADJECTIVES.find((a) => a.category === "ordinal" && a.value === d.day);
    if (ord && (split(ord.declension.masc_inan.nominativ.sg)[0] !== split(d.nom)[0] || split(ord.declension.masc_inan.genitiv.sg)[0] !== split(d.gen)[0]))
      r.errors.push(`${QUIZ}: ДАНІ — день ${d.day} не збігається з порядковим ${ord.cz}`);
    for (const mode of ["gen", "nom"] as const) {
      const id = `date-${d.day}::${mode}::x`;
      const right = split(mode === "gen" ? d.gen : d.nom);
      const other = split(mode === "gen" ? d.nom : d.gen);
      // дублет (analytic / fused) обирається навмання: 12 вибірок, далі — доки кожен варіант не трапиться відповіддю (до
      // 400; раніше фіксовані 12 інколи пропускали один варіант — випадкова «дірка» date-24, 2026-10-07)
      const qs: AnyQ[] = [];
      for (let i = 0; i < 400 && (i < (right.length > 1 ? 12 : TRIES) || (qs.length > 0 && !right.every((f) => qs.some((q) => q.correct === f)))); i++) qs.push(...forcedN(gen, id, 1));
      if (!inFocus(id)) continue;
      if (qs.length === 0) gap(r, QUIZ, `${id} не питається`);
      for (const f of right) if (qs.length > 0 && !qs.some((q) => q.correct === f)) gap(r, QUIZ, `${id}: варіант «${f}» не питається`);
      for (const q of qs) {
        basic(r, QUIZ, q);
        const i = right.indexOf(q.correct);
        if (i < 0) bad(q, "правильна не форма цього відмінка");
        else if (distractorOf(q) !== other[Math.min(i, other.length - 1)]) bad(q, "дистрактор не інший відмінок у тому ж варіанті");
        const month = months.find((m) => q.promptWord === `${d.day}. ${split(m.declension.nominativ.sg)[0]}`);
        if (!month) bad(q, "заголовок не «день. місяць»");
        else {
          if (d.day > month.month!.maxDay) bad(q, "такого дня в місяці немає");
          const want = split((mode === "gen" ? month.declension.genitiv : month.declension.nominativ).sg)[0];
          if (!(q.contextPhrase ?? "").includes(`___ ${want}`)) bad(q, `після пропуску не «${want}»`);
        }
        if (mode === "nom" && /^(dnes|zítra|včera) (je|bude|byl)/i.test(q.contextPhrase ?? "")) bad(q, "«Dnes je ___» допускає й родовий");
        if (month && q.promptUk !== `${d.uk} ${UK_MONTH_GEN[month.month!.num - 1]}`) bad(q, `переклад не «${d.uk} ${UK_MONTH_GEN[month.month!.num - 1]}»`);
        if (!/[еє]$/.test(d.uk)) bad(q, `переклад дня не в середньому роді («п'яте травня»): ${d.uk}`);
      }
    }
  }

  // ── Час: розмовне 1–12 × кожні 5 хв, офіційне 0–23 × кожні 5 хв (0:00 — «půlnoc», не питаємо)
  const allReadings = (sys: "formal" | "colloquial") => {
    const set = new Set<string>();
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) { const x = oSentence(h, m, sys); if (x) set.add(x); }
    return set;
  };
  for (const sys of ["colloquial", "formal"] as const) {
    const valid = allReadings(sys);
    for (let h = sys === "formal" ? 0 : 1; h <= (sys === "formal" ? 23 : 12); h++)
      for (let m = 0; m < 60; m += 5) {
        const why = skipReason(TIME_SKIP_RULES, { sys, h24: h, m });
        if (why) { exclude(r, `${QUIZ}: ${why}`); continue; }
        const id = `time-${sys}-${h}-${m}::${sys}::x`;
        const qs = forced(gen, id);
        if (inFocus(id) && qs.length === 0) gap(r, QUIZ, `${id} не питається`);
        for (const q of qs) {
          basic(r, QUIZ, q);
          if (q.correct !== oSentence(h, m, sys)) bad(q, `правильна не «${oSentence(h, m, sys)}»`);
          const d = distractorOf(q);
          if (!d || !valid.has(d)) bad(q, "дистрактор не читання іншого часу");
        }
      }
  }

  // ── Частина доби: кожна частина; години з даних (DAY_PARTS.quizHours) — не перша година частини й не північ
  const partsAsked = new Set<string>();
  for (const part of DAY_PARTS)
    for (const h of part.quizHours) {
      if (h === 0 || ORACLE_PARTS.some((p) => p.from === h)) r.errors.push(`${QUIZ}: ДАНІ — година ${h} на межі частини доби`);
      for (const m of [0, 15, 30, 45]) {
        const id = `time-daypart-${h}-${m}::daypart::x`;
        const qs = forced(gen, id);
        if (inFocus(id) && qs.length === 0) gap(r, QUIZ, `${id} не питається`);
        const i = partIndex(h);
        for (const q of qs) {
          basic(r, QUIZ, q);
          const bare = oSentence(h, m, "colloquial");
          if (q.correct !== `${bare} ${ORACLE_PARTS[i].phrase}`) bad(q, `правильна не «${bare} ${ORACLE_PARTS[i].phrase}»`);
          else partsAsked.add(ORACLE_PARTS[i].phrase);
          const j = ORACLE_PARTS.findIndex((p) => distractorOf(q) === `${bare} ${p.phrase}`);
          const n = ORACLE_PARTS.length;
          if (j < 0 || j === i || j === (i + 1) % n || j === (i + n - 1) % n) bad(q, "дистрактор — не та сама година з НЕсуміжною частиною доби");
        }
      }
    }
  if (!FOCUS) for (const p of ORACLE_PARTS) if (!partsAsked.has(p.phrase)) gap(r, QUIZ, `частина доби «${p.phrase}» не питається`);

  // ── «V kolik?»: 1–12 × чверті
  for (let h = 1; h <= 12; h++)
    for (const m of [0, 15, 30, 45]) {
      const id = `time-at-${h}-${m}::at::x`;
      const qs = forced(gen, id);
      if (inFocus(id) && qs.length === 0) gap(r, QUIZ, `${id} не питається`);
      const group = oColloquial(h, m, "akuzativ")!;
      const okDistractors = [oWrongVe(group)];
      if (m !== 0) okDistractors.push(oVe(oColloquial(h === 1 ? 12 : h - 1, m, "akuzativ")!));
      const nom = oColloquial(h, m)!;
      if (nom !== group) okDistractors.push(oVe(nom));
      for (const q of qs) {
        basic(r, QUIZ, q);
        if (q.correct !== oVe(group)) bad(q, `правильна не «${oVe(group)}»`);
        if (!okDistractors.includes(distractorOf(q) ?? "")) bad(q, "дистрактор не хибна вокалізація / сусідня опора / називний");
      }
    }

  // ── Дні тижня
  const days = NOUNS.filter((n) => n.category === "days");
  const akuz = (d: NounEntry) => split(d.declension.akuzativ.sg)[0];
  for (const d of days) {
    for (const kind of ["when", "name"] as const) {
      const id = `weekday-${kind}::${d.id}::x`;
      const qs = forced(gen, id);
      if (inFocus(id) && qs.length === 0) gap(r, QUIZ, `${id} не питається`);
      for (const q of qs) {
        basic(r, QUIZ, q);
        if (kind === "when") {
          if (q.correct !== oVe(akuz(d))) bad(q, `правильна не «${oVe(akuz(d))}»`);
          const dd = distractorOf(q);
          if (dd !== oWrongVe(akuz(d)) && !days.some((o) => o !== d && dd === oVe(akuz(o)))) bad(q, "дистрактор не хибна вокалізація чи інший день");
        } else {
          if (q.correct !== d.cz) bad(q, `правильна не «${d.cz}»`);
          if (!days.some((o) => o !== d && distractorOf(q) === o.cz)) bad(q, "дистрактор не інший день");
        }
      }
    }
  }
  if (!FOCUS) for (let i = 0; i < 500; i++) for (const q of gen({})) basic(r, QUIZ, q);
}

// ─────────────── Запуск ───────────────
interface Gens {
  decl: Gen<DeclQuestion>;
  nouns: Gen<NounQuestion>;
  numerals: Gen<AnyQ & { blank?: string }>;
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
  if (on("nouns")) checkNoPluralNouns(r, g.nouns);
  if (on("decl") || on("preps") || on("numerals")) checkNoPluralBanks(r);
  if (on("decl") || on("preps") || on("numerals")) checkUsageBanks(r);
  if (on("numerals")) checkUsageNumerals(r, g.numerals);
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
  const withoutTag = (tag: string): typeof candidateNumbers => (n, ...rest) => candidateNumbers({ ...n, sem: n.sem.filter((t) => t !== tag) }, ...rest);
  const withoutOneSystem = withoutTag("oneSystem");
  const cases: { name: string; only: (keyof Gens)[]; focus: string[]; gens: Partial<Gens>; numbersOf?: typeof candidateNumbers }[] = [
    { name: "NO_PLURAL: metro у множині (вибір числа без тегу oneSystem)", only: ["preps"], focus: ["metro"], gens: {}, numbersOf: withoutOneSystem },
    { name: "NOUN_USAGE_RULES: «k patru» (вибір числа без тегу floor)", only: ["preps"], focus: ["patro"], gens: {}, numbersOf: withoutTag("floor") },
    { name: "NOUN_USAGE_RULES: лічба з формою, якої мова не вживає (hlavami)", only: ["numerals"], focus: ["hlava"], gens: { numerals: mutate(REAL.numerals, (q) => (q.blank === "noun" ? { ...q, promptWord: "hlava", correct: "hlavami", options: ["hlavami", "hlavy"] } : q)) } },
    { name: "NO_PLURAL: rodina в множині у фразі без plOk", only: ["nouns"], focus: ["rodina::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId === "rodina::lokal::pl" ? { ...q, contextPhrase: "Čtu o ___." } : q)) } },
    { name: "значення: фраза тварини з прикметником їжі («Hraju si s teplým kuřetem»)", only: ["decl"], focus: ["teply::"], gens: { decl: (s) => REAL.decl(s).map((q, i) => (i === 0 ? { ...q, comboId: "teply::neut_instrumental::sg", contextPhrase: "Hraju si s ___ kuřetem.", correct: "teplým", options: ["teplým", "teplou"] } : q)) } },
    { name: "значення: підказка не того значення (kuře, «курча (тварина)» ↔ «курча (їжа)»)", only: ["nouns"], focus: ["kure::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId.startsWith("kure::") && q.contextPhrase ? { ...q, promptUk: q.promptUk === "курча (тварина)" ? "курча (їжа)" : "курча (тварина)" } : q)) } },
    { name: "зникла клітинка (velký чол. істот. орудний мн.)", only: ["decl"], focus: ["velky::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId === "velky::masc_anim_instrumental::pl" ? null : q)) } },
    { name: "хибна правильна відповідь у прикметника", only: ["decl"], focus: ["stary::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId.startsWith("stary::") ? swap(q) : q)) } },
    { name: "дійсна форма як дистрактор (pán: páni / pánové)", only: ["nouns"], focus: ["muz-pan::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId === "muz-pan::nominativ::pl" ? { ...q, options: [q.correct, q.correct === "páni" ? "pánové" : "páni"] } : q)) } },
    { name: "залишок «{s}» у фразі", only: ["nouns"], focus: ["stul::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId.startsWith("stul::") && q.contextPhrase ? { ...q, contextPhrase: `{s} ${q.contextPhrase}` } : q)) } },
    { name: "чужий власник у «чий?»", only: ["decl"], focus: ["jeho::", "jeji::owner", "jejich::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId.includes("::owner_") ? swap(q) : q)) } },
    { name: "особовий: форма іншого регістру", only: ["decl"], focus: ["pp-ja::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId === "pp-ja::x_genitiv::0" ? { ...q, correct: "mne", options: ["mne", distractorOf(q) ?? "mi"] } : q)) } },
    // Мутація не залежить від того, чи жереб дав фразу з «ve ___»: питання velký із реченням отримує «v ___» перед формою
    // на v- (velkém, velkého…) — потрібне «ve», оракул мусить це спіймати (раніше випадок падав, коли такої фрази не було).
    { name: "хибна вокалізація (ve → v)", only: ["decl"], focus: ["velky::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId.startsWith("velky::") && q.contextPhrase ? { ...q, contextPhrase: "Bydlím v ___ domě." } : q)) } },
    { name: "хибна правильна відповідь в іменника", only: ["nouns"], focus: ["stul::"], gens: { nouns: mutate(REAL.nouns, (q) => (q.comboId.startsWith("stul::") ? swap(q) : q)) } },
    { name: "прийменник: зникла множина (v + місцевий)", only: ["preps"], focus: ["prep-v::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId === "prep-v::dual-location::lokal" && /множина/.test(q.taskText) ? null : q)) } },
    { name: "прийменник: зникла однина (po + знахідний, až po krk)", only: ["preps"], focus: ["prep-po::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId === "prep-po::dual-motion::akuzativ" && /однина/.test(q.taskText) ? null : q)) } },
    { name: "особовий já: книжне mne як правильна", only: ["decl"], focus: ["pp-ja::"], gens: { decl: mutate(REAL.decl, (q) => (q.comboId === "pp-ja::x_akuzativ::0" ? { ...q, correct: "mne", options: ["mne", distractorOf(q) ?? "mi"] } : q)) } },
    { name: "прийменник: зникла множина (při)", only: ["preps"], focus: ["prep-pri::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId === "prep-pri::fixnoun::lokal" && /множина/.test(q.taskText) ? null : q)) } },
    { name: "прийменник: зникла множина (mimo)", only: ["preps"], focus: ["prep-mimo::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId === "prep-mimo::fixnoun::akuzativ" && /множина/.test(q.taskText) ? null : q)) } },
    { name: "зникло комбо прийменника (bez)", only: ["preps"], focus: ["prep-bez::"], gens: { preps: mutate(REAL.preps, (q) => (q.comboId.startsWith("prep-bez::") ? null : q)) } },
    { name: "числівник: зникла форма «pěti»", only: ["numerals"], focus: ["card-pet"], gens: { numerals: mutate(REAL.numerals, (q) => (q.correct === "pěti" ? null : q)) } },
    { name: "числівник: зник рід іменника (dva + чол. істот. в орудному)", only: ["numerals"], focus: ["card-dva"], gens: { numerals: mutate(REAL.numerals, (q) => (q.comboId === "card-dva::instrumental::x" && q.taskText.includes("чол. іст.") ? null : q)) } },
    { name: "порядковий: зникла клітинка (druhý жін. місцевий одн.)", only: ["numerals"], focus: ["ord-druhy"], gens: { numerals: mutate(REAL.numerals, (q) => (q.comboId === "ord-druhy::fem_lokal::sg" ? null : q)) } },
    { name: "порядковий: клітинка під правилом ORDINAL_BARE_SKIPS питається без речення (osmý, множина)", only: ["numerals"], focus: ["ord-osmy"], gens: { numerals: (s) => (s["ord-osmy::masc_anim_genitiv::pl"] ? [{ ...REAL.numerals({ "ord-druhy::fem_lokal::sg": 1 })[0], comboId: "ord-osmy::masc_anim_genitiv::pl", contextPhrase: undefined, correct: "osmých", options: ["osmých", "osmým"] } as never] : REAL.numerals(s)) } },
    { name: "порядковий: хибна правильна відповідь (třetí)", only: ["numerals"], focus: ["ord-treti"], gens: { numerals: mutate(REAL.numerals, (q) => (q.comboId.startsWith("ord-treti::") ? swap(q) : q)) } },
    { name: "зникла форма дієслова", only: ["verbs"], focus: ["delat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "delat::past::ja" ? null : q)) } },
    { name: "дієслово: друга половина дублета (jsi se) як дистрактор", only: ["verbs"], focus: ["ucit-se::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "ucit-se::past::ty" ? { ...q, options: [q.correct, "učil jsi se"] } : q)) } },
    { name: "вид: хибна правильна відповідь (psát)", only: ["verbs"], focus: ["psat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "psat::aspect::x" ? swap(q) : q)) } },
    { name: "вид: доконаний інфінітив після фазового (vstávat)", only: ["verbs"], focus: ["vstavat::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "vstavat::aspect::x" ? swap(q) : q)) } },
    { name: "вид: «a bude hotovo» для resultative: false (přijít)", only: ["verbs"], focus: ["prijit::"], gens: { verbs: mutate(REAL.verbs, (q) => (q.comboId === "prijit::aspect::x" ? { ...q, contextPhrase: "Zítra ___ a bude hotovo." } : q)) } },
    { name: "прислівник: хибна правильна відповідь (vlevo)", only: ["adverbs"], focus: ["adv-vlevo::"], gens: { adverbs: mutate(REAL.adverbs, (q) => (q.comboId.startsWith("adv-vlevo::") && !q.comboId.endsWith("rev") ? swap(q) : q)) } },
    { name: "прислівник: зворотне — хибне питальне слово", only: ["adverbs"], focus: ["adv-dole::"], gens: { adverbs: mutate(REAL.adverbs, (q) => (q.comboId === "adv-dole::orig::rev" ? swap(q) : q)) } },
    { name: "прислівник: зникло пряме «кудою?» (tudy)", only: ["adverbs"], focus: ["adv-tady::"], gens: { adverbs: mutate(REAL.adverbs, (q) => (q.comboId === "adv-tady::path::x" ? null : q)) } },
    { name: "дата: дистрактор в іншому варіанті дублета", only: ["datetime"], focus: ["date-25::"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "date-25::gen::x" ? { ...q, options: [q.correct, q.correct === "pětadvacátého" ? "dvacátý pátý" : "pětadvacátý"] } : q)) } },
    { name: "дата: злитий варіант ніколи не питається", only: ["datetime"], focus: ["date-27::"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "date-27::gen::x" && q.correct === "sedmadvacátého" ? null : q)) } },
    { name: "час: «půl dvě» замість «půl druhé»", only: ["datetime"], focus: ["time-colloquial-1-30"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "time-colloquial-1-30::colloquial::x" ? { ...q, correct: "Je půl dvě", options: ["Je půl dvě", distractorOf(q)!] } : q)) } },
    { name: "час: зникло офіційне 23:55", only: ["datetime"], focus: ["time-formal-23-55"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "time-formal-23-55::formal::x" ? null : q)) } },
    { name: "частина доби: суміжна як дистрактор (23 — večer)", only: ["datetime"], focus: ["time-daypart-23-"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId.startsWith("time-daypart-23-") ? { ...q, options: [q.correct, q.correct.replace("v noci", "večer")] } : q)) } },
    { name: "v kolik: «v jedna hodina» як правильна", only: ["datetime"], focus: ["time-at-1-0"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "time-at-1-0::at::x" ? { ...q, correct: "v jedna hodina", options: ["v jedna hodina", q.correct] } : q)) } },
    { name: "день: «v čtvrtek» як правильна", only: ["datetime"], focus: ["weekday-when::ctvrtek"], gens: { datetime: mutate(REAL.datetime, (q) => (q.comboId === "weekday-when::ctvrtek::x" ? { ...q, correct: "v čtvrtek", options: ["v čtvrtek", "ve čtvrtek"] } : q)) } },
  ];
  // Детермінований прогін: обидва прогони кожного випадку — з тим самим зерном генератора випадкових чисел, тож результат
  // відтворюваний (раніше «хибна вокалізація» інколи не знаходила жодної фрази з «ve ___» і падала випадково).
  const seeded = (seed: number) => {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const realRandom = Math.random;
  let ok = true;
  for (const t of cases) {
    FOCUS = t.focus;
    Math.random = seeded(20261006);
    const base = runAll(REAL, t.only).errors.length;
    Math.random = seeded(20261006);
    NUMBERS_OF = t.numbersOf ?? candidateNumbers;
    const r = runAll({ ...REAL, ...t.gens }, t.only);
    NUMBERS_OF = candidateNumbers;
    Math.random = realRandom;
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
