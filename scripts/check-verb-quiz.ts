// Перевірка квізу дієслів після змін у словнику або в логіці квізу.
// Запуск (esbuild-бандл, як і решта harness'ів проєкту; код виходу 1 — є ПОМИЛКИ):
//   npx esbuild scripts/check-verb-quiz.ts --bundle --platform=node --format=cjs --outfile=node_modules/.check-verb-quiz.cjs
//   node node_modules/.check-verb-quiz.cjs
//
// Нові дієслова додаються в src/data/verbs.ts БЕЗ змін у логіці квізу — цей скрипт
// ловить те, що в даних може зламати питання:
//  1. Дані: порожні/дублетні поля дієприкметників, форми з "undefined".
//  2. Минулий час: для КОЖНОГО дієслова × КОЖНОГО з 16 підметів форма збігається з
//     незалежно обчисленим очікуванням (рід, число, допоміжне, ses/sis) — і в табличній
//     позиції (дієслово відкриває речення), і ПІСЛЯ прислівника (клітики на 2-му місці).
//  3. Майбутній час: те саме (se/si перед дієсловом після прислівника).
//  4. Видові фрейми: структура (позиція {V}), кожна придатна пара фрейм × підмет ×
//     половина дублета (ses / jsi se) дає дві різні форми без "undefined", обидві
//     кнопки в одному стилі.
//  5. Делімітативні пари: кандидати без прапорця delimitativePartner (INFO).
//  6. Пари без жодного придатного фрейму (WARN — питань на таку пару не буде); фазові фрейми: лише недоконаний
//     з durative: false, форма = клітики + se/si + інфінітив; фрейми тривалості й «a bude hotovo» — за прапорцями.
//  7. Вага минулого (PAST_BASE_SHARE) у межах (0, 1].
//  8. Підписи завдань (усі часи й особи): одна пара дужок, не довші за LABEL_MAX.
//  9. Симуляція сесій: жодного зламаного питання.
//
// Це перевірка ПОРЯДКУ СЛІВ і ФОРМ, не лексики: природність речення з конкретним
// дієсловом (напр. "Celou noc jsem otevřel" для пари, де це дивно) скрипт не оцінює.

import { VERBS } from "../src/data/verbs";
import { BYT_FUTURE, PAST_AUX } from "../src/data/auxVerbs";
import { PastParticiple, VerbEntry, PERSON_ORDER } from "../src/types";
import {
  PAST_SUBJECT_ORDER,
  PAST_BASE_SHARE,
  IMPERATIVE_ORDER,
  PastSubject,
  pastForm,
  pastFormAfterAdverb,
  futureForm,
  futureFormAfterAdverb,
} from "../src/utils/verbForms";
import {
  IMPERF_FRAMES,
  PERF_FRAMES,
  aspectCandidates,
  generateVerbSession,
  taskTextFor,
} from "../src/utils/verbFlashcardEngine";

const errors: string[] = [];
const warnings: string[] = [];
const infos: string[] = [];
const err = (m: string) => errors.push(m);

const byId: Record<string, VerbEntry> = Object.fromEntries(VERBS.map((v) => [v.id, v]));

// ── 1. Дані ──
const PP_KEYS: (keyof PastParticiple)[] = ["m", "f", "n", "manim_pl", "other_pl"];
for (const v of VERBS) {
  for (const k of PP_KEYS) {
    const x = v.pastParticiple?.[k];
    if (!x || /undefined/.test(x)) err(`${v.id}: pastParticiple.${k} порожнє або "undefined"`);
    else if (/ \/ /.test(x)) warnings.push(`${v.id}: pastParticiple.${k} містить дублет "${x}" — рушій дублетів у дієприкметниках не підтримує`);
  }
  if (v.reflexive && v.reflexive !== "se" && v.reflexive !== "si") err(`${v.id}: reflexive має бути se/si`);
  // Правила додавання дієслів (шапка verbs.ts): future/present обов'язкові, без дублетів.
  if (v.aspect === "perfective" && !v.future) err(`${v.id}: доконане без поля future ("budu udělat")`);
  if (v.aspect === "imperfective" && !v.present) err(`${v.id}: недоконане без поля present`);
  // registerNote показується на табі «своєї» дієвідміни (недоконаний — теперішній,
  // доконаний — майбутній): без таблиці банеру нема де з'явитись. Назву часу в тексті
  // не пишемо — її вже показує активний таб.
  if (v.registerNote) {
    if (v.aspect === "imperfective" && !v.present) err(`${v.id}: registerNote без таблиці теперішнього часу`);
    if (v.aspect === "perfective" && !v.future) err(`${v.id}: registerNote без таблиці майбутнього часу`);
    if (/теперішн|майбутн/i.test(v.registerNote)) warnings.push(`${v.id}: registerNote називає час — його вже показує таб`);
  }
  if (v.aspectPairId && !byId[v.aspectPairId]) err(`${v.id}: aspectPairId "${v.aspectPairId}" не знайдено`);
  if (v.aspectPairId && byId[v.aspectPairId] && byId[v.aspectPairId].aspectPairId !== v.id) {
    err(`${v.id}: видова пара не двонапрямна`);
  }
}

// ── 2–3. Очікування форм (незалежно від реалізації) ──
const EXPECT: Record<PastSubject, { pp: keyof PastParticiple; aux: "" | "ja" | "ty" | "my" | "vy" }> = {
  ja: { pp: "m", aux: "ja" },
  ja_f: { pp: "f", aux: "ja" },
  ty: { pp: "m", aux: "ty" },
  ty_f: { pp: "f", aux: "ty" },
  on: { pp: "m", aux: "" },
  ona: { pp: "f", aux: "" },
  ono: { pp: "n", aux: "" },
  my: { pp: "manim_pl", aux: "my" },
  my_f: { pp: "other_pl", aux: "my" },
  vy: { pp: "manim_pl", aux: "vy" },
  vy_f: { pp: "other_pl", aux: "vy" },
  vy_sg_m: { pp: "m", aux: "vy" },
  vy_sg_f: { pp: "f", aux: "vy" },
  oni_manim: { pp: "manim_pl", aux: "" },
  oni_other: { pp: "other_pl", aux: "" },
  oni_neut: { pp: "f", aux: "" }, // середній рід множини -la = жін. однини
};

const CLITIC_WORDS = new Set(["jsem", "jsi", "jsme", "jste", "se", "si", "ses", "sis"]);

// Очікувана форма (для ty+зворотне — дублет "стягнена / повна", стягнена першою).
function expectedPast(v: VerbEntry, s: PastSubject, afterAdverb: boolean): string {
  const e = EXPECT[s];
  const pp = v.pastParticiple[e.pp];
  const aux = e.aux ? PAST_AUX[e.aux] : "";
  const tySingular = s === "ty" || s === "ty_f";
  if (tySingular && v.reflexive) {
    const contracted = v.reflexive === "se" ? "ses" : "sis";
    return afterAdverb
      ? `${contracted} ${pp} / jsi ${v.reflexive} ${pp}`
      : `${pp} ${contracted} / ${pp} jsi ${v.reflexive}`;
  }
  const clitics = [aux, v.reflexive ?? ""].filter(Boolean);
  return afterAdverb ? [...clitics, pp].join(" ") : [pp, ...clitics].join(" ");
}

let pastChecked = 0;
for (const v of VERBS) {
  if (PP_KEYS.some((k) => !v.pastParticiple?.[k])) continue; // вже у помилках
  for (const s of PAST_SUBJECT_ORDER) {
    const initialAll = pastForm(v, s);
    const afterAll = pastFormAfterAdverb(v, s);
    const eInit = expectedPast(v, s, false);
    const eAfter = expectedPast(v, s, true);
    pastChecked++;
    if (initialAll !== eInit) err(`${v.id} ${s}: таблична форма "${initialAll}" ≠ очікуваної "${eInit}"`);
    if (afterAll !== eAfter) err(`${v.id} ${s}: після прислівника "${afterAll}" ≠ очікуваної "${eAfter}"`);
    // Порядок клітик — для КОЖНОЇ половини дублета: після прислівника клітики ПЕРЕД
    // дієприкметником; таблична форма (дієслово відкриває речення) — після нього.
    for (const after of afterAll.split(" / ")) {
      const t = after.split(" ");
      if (t[t.length - 1] !== v.pastParticiple[EXPECT[s].pp]) err(`${v.id} ${s}: після прислівника дієприкметник має бути останнім: "${after}"`);
      if (!t.slice(0, -1).every((w) => CLITIC_WORDS.has(w))) err(`${v.id} ${s}: перед дієприкметником лише клітики: "${after}"`);
    }
    for (const initial of initialAll.split(" / ")) {
      const ti = initial.split(" ");
      if (!ti.slice(1).every((w) => CLITIC_WORDS.has(w))) err(`${v.id} ${s}: після дієприкметника лише клітики: "${initial}"`);
    }
    if (/undefined/.test(initialAll + afterAll)) err(`${v.id} ${s}: "undefined" у формі`);
  }
}

let futureChecked = 0;
for (const v of VERBS) {
  for (const p of PERSON_ORDER) {
    futureChecked++;
    const refl = v.reflexive ?? "";
    // Дублети даних ("a / b") лишаються цілими, як у питаннях на дієвідміну; se/si
    // додається до кожної половини.
    const table = futureForm(v, p);
    const after = futureFormAfterAdverb(v, p);
    const halves = v.future ? v.future[p].split(" / ") : [`${BYT_FUTURE[p]} ${v.cz}`];
    const eTable = v.future
      ? halves.map((h) => [h, refl].filter(Boolean).join(" ")).join(" / ")
      : [BYT_FUTURE[p], refl, v.cz].filter(Boolean).join(" ");
    const eAfter = halves.map((h) => [refl, h].filter(Boolean).join(" ")).join(" / ");
    if (table !== eTable) err(`${v.id} future ${p}: таблична "${table}" ≠ "${eTable}"`);
    if (after !== eAfter) err(`${v.id} future ${p}: після прислівника "${after}" ≠ "${eAfter}"`);
    for (const h of after.split(" / ")) {
      if (v.reflexive && h.split(" ")[0] !== v.reflexive) err(`${v.id} future ${p}: se/si має бути ПЕРШИМ після прислівника: "${h}"`);
    }
  }
}

// ── 4. Структура фреймів ──
const ALL_FRAMES = [...IMPERF_FRAMES.map((f) => ({ f, side: "недоконаний" })), ...PERF_FRAMES.map((f) => ({ f, side: "доконаний" }))];
for (const { f, side } of ALL_FRAMES) {
  if (f.text.split("{V}").length !== 2) err(`фрейм "${f.text}" (${side}): має бути рівно один {V}`);
  if (f.text.split("{O}").length !== 2 || !f.text.includes("{V}{O}")) err(`фрейм "${f.text}" (${side}): {O} (додаток пари) має йти одразу після {V}`);
  if (f.position === "initial" && !f.text.startsWith("{V}")) err(`фрейм "${f.text}": position=initial, але {V} не на початку`);
  if (f.position === "afterAdverb" && !/^\S+ \{V\}/.test(f.text)) err(`фрейм "${f.text}": position=afterAdverb вимагає одного слова перед {V}`);
  if (f.subjects.length === 0) err(`фрейм "${f.text}": порожній набір підметів`);
}

// ── 4–6. Придатні (фрейм × підмет) для кожного дієслова з парою ──
let candidates = 0;
const noFrames: string[] = [];
// Стиль форми 2 ос. одн. зі зворотним: "short" (ses/sis), "long" (jsi se/si), "" — не стосується.
function tyStyle(form: string): "short" | "long" | "" {
  if (/(^|\s)(ses|sis)(\s|$)/.test(form)) return "short";
  if (/(^|\s)jsi (se|si)(\s|$)/.test(form)) return "long";
  return "";
}
let halfPairs = 0;
for (const v of VERBS) {
  if (!v.aspectPairId || !byId[v.aspectPairId]) continue;
  const cands = aspectCandidates(v);
  if (cands.length === 0) noFrames.push(`${v.cz}${v.reflexive ? " " + v.reflexive : ""} (${v.aspect})`);
  for (const c of cands) {
    candidates++;
    const label = `${v.id} «${c.phrase}» ${c.subject} /${c.half}`;
    if (c.phrase.split("___").length !== 2 || /[{}]|undefined|  /.test(c.phrase)) err(`${label}: зламане речення`);
    // Фазовий фрейм: лише недоконаний інфінітив; форма = клітики підмета + se/si + інфінітив (як після прислівника).
    if (c.kind === "phasal") {
      if (v.aspect !== "imperfective" || v.durative) err(`${label}: фазовий фрейм лише для недоконаного з durative: false`);
      const p = byId[v.aspectPairId];
      const fut = c.tense === "future";
      const exp = (x: VerbEntry) =>
        fut ? [x.reflexive, x.cz].filter(Boolean).join(" ") : expectedPast({ ...x, pastParticiple: Object.fromEntries(PP_KEYS.map((k) => [k, x.cz])) as unknown as PastParticiple } as VerbEntry, c.subject as PastSubject, true);
      if (!exp(v).split(" / ").includes(c.correct)) err(`${label}: форма "${c.correct}" ≠ очікуваної "${exp(v)}"`);
      if (!exp(p).split(" / ").includes(c.distractor)) err(`${label}: дистрактор "${c.distractor}" ≠ очікуваного "${exp(p)}"`);
    }
    if (c.kind === "durative" && !v.durative) err(`${label}: фрейм тривалості для durative: false`);
    if (c.kind === "resultative" && !v.resultative) err(`${label}: «a bude hotovo» для resultative: false`);
    if (!c.correct || !c.distractor) err(`${label}: порожня форма`);
    else if (/undefined|NaN|\[object/.test(c.correct + c.distractor)) err(`${label}: зламана форма "${c.correct}" / "${c.distractor}"`);
    else if (c.correct === c.distractor) err(`${label}: однакові форми "${c.correct}"`);
    // Кнопки різняться лише видом: стиль ses/jsi se або однаковий, або неактуальний для одного з дієслів.
    const a = tyStyle(c.correct);
    const b = tyStyle(c.distractor);
    if (a && b && a !== b) err(`${label}: різний стиль у варіантах "${c.correct}" / "${c.distractor}"`);
    if (c.half === 1) halfPairs++;
  }
}
if (noFrames.length > 0) warnings.push(`пари без жодного придатного фрейму (питань на них не буде): ${noFrames.join(", ")}`);
infos.push(`Кандидатів з другою половиною дублета (jsi se/si): ${halfPairs}`);

for (const v of VERBS) {
  if (v.aspect !== "imperfective" || !v.aspectPairId) continue;
  const p = byId[v.aspectPairId];
  if (!p) continue;
  const strict = p.cz === "po" + v.cz || p.cz === "pro" + v.cz;
  if (strict && !v.delimitativePartner) infos.push(`кандидат у делімітативні (немає delimitativePartner): ${v.cz} → ${p.cz}`);
  if (v.delimitativePartner && !/^(po|pro)/.test(p.cz)) warnings.push(`${v.id}: delimitativePartner, але партнер "${p.cz}" не на po-/pro-`);
}

// ── 7. Вага минулого ──
if (!(PAST_BASE_SHARE > 0 && PAST_BASE_SHARE <= 1)) err(`PAST_BASE_SHARE=${PAST_BASE_SHARE} поза (0, 1]`);
infos.push(`PAST_BASE_SHARE = ${PAST_BASE_SHARE.toFixed(4)} (клітинок минулого: ${PAST_SUBJECT_ORDER.length})`);

// ── 8. Підписи завдань ──
// Рядок завдання — один центрований текст без обмеження рядків; задовгий переноситься
// на другий рядок. Планка — найдовший підпис, що вже є в застосунку ("on/ona/ono
// (він/вона/воно)", 43 символи); нові підписи її не перевищують.
const LABEL_MAX = 43;
const allLabelTexts: string[] = [
  ...PAST_SUBJECT_ORDER.map((k) => taskTextFor("past", k)),
  ...PERSON_ORDER.flatMap((p) => [taskTextFor("present", p), taskTextFor("future", p)]),
  ...IMPERATIVE_ORDER.map((p) => taskTextFor("imperative", p)),
];
let longestLabel = 0;
for (const t of allLabelTexts) {
  longestLabel = Math.max(longestLabel, t.length);
  const open = (t.match(/\(/g) ?? []).length;
  const close = (t.match(/\)/g) ?? []).length;
  if (open !== 1 || close !== 1) err(`підпис «${t}»: має бути рівно одна пара дужок (є ${open}/${close})`);
  if (t.length > LABEL_MAX) err(`підпис «${t}»: ${t.length} символів > ${LABEL_MAX}`);
  if (/undefined/.test(t)) err(`підпис «${t}»: "undefined"`);
}
infos.push(`Підписів завдань: ${allLabelTexts.length}; найдовший ${longestLabel} символів (ліміт ${LABEL_MAX})`);

// ── 9. Симуляція ──
let questions = 0;
let aspectQuestions = 0;
for (let r = 0; r < 1500; r++) {
  for (const q of generateVerbSession(12)) {
    questions++;
    if (q.contextPhrase) aspectQuestions++;
    const all = [q.correct, ...q.options, q.contextPhrase ?? "", q.taskText].join(" | ");
    if (/undefined|NaN|\[object/.test(all)) err(`сесія: зламаний текст у питанні ${q.comboId}: ${all}`);
    if (q.options.length !== 2 || q.options[0] === q.options[1] || !q.options.includes(q.correct)) {
      err(`сесія: некоректні варіанти у ${q.comboId}: ${q.options.join(" / ")}`);
    }
  }
}

console.log(`Дієслів: ${VERBS.length}; клітинок минулого перевірено: ${pastChecked}; майбутнього: ${futureChecked}`);
console.log(`Придатних (фрейм × підмет): ${candidates}; питань у симуляції: ${questions} (видових ${aspectQuestions})`);
infos.forEach((m) => console.log("INFO  " + m));
warnings.forEach((m) => console.log("WARN  " + m));
errors.slice(0, 40).forEach((m) => console.log("ERROR " + m));
if (errors.length > 40) console.log(`ERROR ... і ще ${errors.length - 40}`);
console.log(`Помилок: ${errors.length}, попереджень: ${warnings.length}`);
process.exit(errors.length > 0 ? 1 : 0);
