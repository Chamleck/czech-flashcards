import { VerbEntry, VerbPerson, PERSON_ORDER } from "../types";
import { BYT_FUTURE, PAST_AUX } from "../data/auxVerbs";
import { firstForm, splitForms } from "./quizCommon";

// ─────────────────────────────────────────────────────────────
// Єдине місце побудови фінітних форм дієслова з правильним порядком
// зворотної клітики se/si. Використовується і карткою розкриття
// (VerbConjugation), і движком квізу (verbFlashcardEngine), щоб логіка
// порядку слів не дублювалась.
// ─────────────────────────────────────────────────────────────

// Рід/число підмета для минулого часу впливає на форму дієприкметника.
// Без суфікса — чоловічий (або змішана група) рід, з суфіксом _f — жіночий
// (мовець/адресат — жінка), _neut — середній рід множини:
//  on = чол. однина, ona = жін. однина, ono = сер. однина;
//  ja/ty/my/vy = чол. або змішана група, ja_f/ty_f/my_f/vy_f = жінка/жінки;
//  vy_sg_m/vy_sg_f = ввічливе «Ви» до ОДНІЄЇ особи (vykání): множинне допоміжне
//  jste + дієприкметник ОДНИНИ за реальним родом адресата («jste dělal/dělala»);
//  oni_manim = чол. істот. множини, oni_other = жін. та чол. неістот. множини
//  (-ly), oni_neut = середній рід множини (-la, збігається з жін. однини).
// Джерела: Rosen & Saloni (ÚČNK UK, honorativ); Adam (APČJ, shoda podle smyslu);
// Wikipedia «Czech conjugation» (neuter plural -la).
export type PastSubject =
  | "ja"
  | "ty"
  | "on"
  | "ona"
  | "ono"
  | "my"
  | "vy"
  | "oni_manim"
  | "oni_other"
  | "ja_f"
  | "ty_f"
  | "my_f"
  | "vy_f"
  | "vy_sg_m"
  | "vy_sg_f"
  | "oni_neut";

// Перші 9 — в тому ж порядку, що й раніше; нові додано в кінець.
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
  "ja_f",
  "ty_f",
  "my_f",
  "vy_f",
  "vy_sg_m",
  "vy_sg_f",
  "oni_neut",
];

// Підписи підметів минулого часу (займенник cz + укр). Рід вказано явно, інакше
// «dělal jsem» і «dělala jsem» були б обидві правильні для «я». Формат один для
// всього квізу: «cz (uk)» — ОДНА пара дужок, складові uk (особа, рід, ввічливість)
// через кому, без вкладених дужок (їх розплющує taskLabel у рушії). Підпис має
// вміщатись в один рядок завдання (LABEL_MAX у scripts/check-verb-quiz.ts).
// Середній рід множини: займенник ona збігається з ona (вона, ед.) і плутає, тому
// підпис дано іменником («ta města» = ті міста; в підписі «вони, сер.», як і в інших): -la, як «města byla».
// variant: клітинка — ВАРІАНТ тієї ж особи за родом/ввічливістю/числом; вона не
// збільшує вагу минулого часу в квізі (див. PAST_BASE_SHARE). Нова клітинка без
// variant вважається окремою особою і додає вагу.
export const PAST_SUBJECT_LABELS: Record<PastSubject, { cz: string; uk: string; variant?: boolean }> = {
  ja: { cz: "já", uk: "я, чол." },
  ja_f: { cz: "já", uk: "я, жін.", variant: true },
  ty: { cz: "ty", uk: "ти, чол." },
  ty_f: { cz: "ty", uk: "ти, жін.", variant: true },
  on: { cz: "on", uk: "він" },
  ona: { cz: "ona", uk: "вона" },
  ono: { cz: "ono", uk: "воно" },
  my: { cz: "my", uk: "ми, чол./змішана" },
  my_f: { cz: "my", uk: "ми, жін.", variant: true },
  vy: { cz: "vy", uk: "ви, чол./змішана" },
  vy_f: { cz: "vy", uk: "ви, жін.", variant: true },
  vy_sg_m: { cz: "vy", uk: "Ви, ввічливо, чол.", variant: true },
  vy_sg_f: { cz: "vy", uk: "Ви, ввічливо, жін.", variant: true },
  oni_manim: { cz: "oni", uk: "вони, чол. істот." },
  oni_other: { cz: "ony", uk: "вони, жін." },
  oni_neut: { cz: "ta města", uk: "вони, сер.", variant: true },
};

// Частка «базових» клітинок серед усіх клітинок минулого. Квіз дієслів множить
// на неї вагу минулого в пулі (kindWeight), тож клітинки-варіанти (рід 1–2 особи,
// ввічливе «Ви», сер. рід множини) тренуються, але не витісняють інші часи:
// частка минулого лишається такою, як була до їх появи.
export const PAST_BASE_SHARE =
  PAST_SUBJECT_ORDER.filter((x) => !PAST_SUBJECT_LABELS[x].variant).length / PAST_SUBJECT_ORDER.length;

// Яку особу допоміжного дієслова "být" використовує підмет минулого часу.
function auxPersonFor(s: PastSubject): VerbPerson {
  switch (s) {
    case "ja":
    case "ja_f":
      return "ja";
    case "ty":
    case "ty_f":
      return "ty";
    case "my":
    case "my_f":
      return "my";
    case "vy":
    case "vy_f":
    case "vy_sg_m":
    case "vy_sg_f":
      return "vy";
    // 3-тя особа (on/ona/ono/oni*) — допоміжного немає
    default:
      return "on";
  }
}

// Яку форму l-дієприкметника бере підмет (і фазове дієслово у «Přestala ___»).
export function participleFor(v: VerbEntry, s: PastSubject): string {
  const pp = v.pastParticiple;
  switch (s) {
    case "ja":
    case "ty":
    case "on":
    case "vy_sg_m":
      return pp.m;
    case "ona":
    case "ja_f":
    case "ty_f":
    case "vy_sg_f":
      return pp.f;
    case "ono":
      return pp.n;
    case "my":
    case "vy":
    case "oni_manim":
      return pp.manim_pl;
    case "oni_other":
    case "my_f":
    case "vy_f":
      return pp.other_pl;
    // Середній рід множини: -la, та сама форма, що жін. однини ("města byla").
    case "oni_neut":
      return pp.f;
  }
}

// Стягнення "jsi" + se/si → ses/sis стосується ЛИШЕ 2-ї особи однини.
function isTySingular(s: PastSubject): boolean {
  return s === "ty" || s === "ty_f";
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

// Дублетні форми зберігаються як "форма1 / форма2" (як усюди в проєкті —
// іменники, дати). firstForm (quizCommon) — детермінований вибір (пул дистракторів і
// комбінації питань на дієвідміну), nthForm — вибір половини за індексом: ОДНУ й
// ту саму для обох варіантів відповіді в питанні, щоб з часом траплялись обидві
// форми, а кнопки різнились лише тим, що тестується.
function nthForm(s: string, n: number): string {
  const parts = splitForms(s);
  return parts[Math.min(n, parts.length - 1)];
}

// Минулий час для підмета: [дієприкметник] [допоміжне] se ("učil jsem se").
// У 3-й особі допоміжного немає: "učil se".
export function pastForm(v: VerbEntry, s: PastSubject): string {
  const participle = participleFor(v, s);

  // Виняток для "ty" (2 особи однини) зі зворотним дієсловом: "jsi" + se/si
  // стягується в ОДНЕ слово — ses/sis. Це кодифікована норма (не розмовне
  // спрощення!), повна форма "jsi se/si" досі офіційно некодифікована, хоч і
  // часта усно (ÚJČ prirucka.ujc.cas.cz/?id=580). Дублет, як усюди в проєкті:
  // стягнена форма першою (кодифікована), повна — другою.
  if (isTySingular(s) && v.reflexive) {
    const contracted = v.reflexive === "se" ? "ses" : "sis";
    return `${participle} ${contracted} / ${participle} jsi ${v.reflexive}`;
  }

  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  const auxP = auxPersonFor(s);
  const aux = auxP === "on" ? "" : PAST_AUX[auxP]; // 3-тя особа → без допоміжного
  return aux ? `${participle} ${aux}${refl}` : `${participle}${refl}`;
}

// ── Форми для вставки у речення ПІСЛЯ початкового прислівника ──
// Таблична форма ("učil jsem se", "naučím se", "budu se učit") правильна, коли
// дієслово відкриває речення. Якщо ж перед ним стоїть прислівник ("Konečně ___"),
// клітики (допоміжне jsem/jsi/jsme/jste, se/si) стають на друге місце ПЕРЕД
// дієприкметником/дієсловом: "Konečně jsem se naučil", "Zítra se naučím",
// "Zítra se budu učit". Порядок клітик: допоміжне → se/si (ÚJČ/FF UK: pořadí
// stálých příklonek -li – být – se/si – zájmena). 2 ос. одн. зі зворотним —
// стягнене ses/sis першим, повна "jsi se" — другою (дублет, як у pastForm).
export function pastFormAfterAdverb(v: VerbEntry, s: PastSubject): string {
  return cliticsBefore(v, s, participleFor(v, s));
}

// Клітики минулого часу підмета s (допоміжне → se/si дієслова v) перед словом head; 2 ос. одн. зі зворотним —
// стягнене ses/sis першим, повна "jsi se" — другою (дублет).
function cliticsBefore(v: VerbEntry, s: PastSubject, head: string): string {
  if (isTySingular(s) && v.reflexive) {
    const contracted = v.reflexive === "se" ? "ses" : "sis";
    return `${contracted} ${head} / jsi ${v.reflexive} ${head}`;
  }
  const auxP = auxPersonFor(s);
  const aux = auxP === "on" ? "" : PAST_AUX[auxP];
  const clitics = [aux, v.reflexive ?? ""].filter(Boolean).join(" ");
  return clitics ? `${clitics} ${head}` : head;
}

// ── Інфінітив після фазового дієслова (přestat, začít) ──
// Минулий: «Přestal ___» — допоміжне підмета і se/si інфінітива стають на 2-ге місце, одразу після дієприкметника
// фазового дієслова, перед інфінітивом: «Přestal jsem se učit», «Přestala ses učit / Přestala jsi se učit». Та
// сама послідовність клітик, що в pastFormAfterAdverb, лише замість дієприкметника — інфінітив.
export function infinitiveAfterPastPhase(v: VerbEntry, s: PastSubject): string {
  return cliticsBefore(v, s, v.cz);
}

// Майбутній: «Přestanu ___» — se/si одразу після фазового дієслова: «Přestanu se učit».
export function infinitiveAfterFuturePhase(v: VerbEntry): string {
  return v.reflexive ? `${v.reflexive} ${v.cz}` : v.cz;
}

// Майбутній час після початкового прислівника: se/si ПЕРЕД дієсловом/budu.
// Дублетні форми ("a / b") обробляються покомпонентно.
export function futureFormAfterAdverb(v: VerbEntry, p: VerbPerson): string {
  const refl = v.reflexive ? `${v.reflexive} ` : "";
  if (v.future) {
    return v.future[p]
      .split(" / ")
      .map((f) => `${refl}${f}`)
      .join(" / ");
  }
  return `${refl}${BYT_FUTURE[p]} ${v.cz}`;
}

export { firstForm, nthForm };

// Зручний доступ до 6 стандартних осіб для теп./майб. таблиць.
export { PERSON_ORDER };

// ── Наказовий спосіб ──
// Лише 3 форми (ty/vy/my). Дані вже містять готові форми зі зворотною
// часткою в правильному місці (напр. "oblékni se", "uč se"), тож просто
// повертаємо їх як є.
export type ImperativePerson = "ty" | "vy" | "my";

export const IMPERATIVE_ORDER: ImperativePerson[] = ["ty", "vy", "my"];

export const IMPERATIVE_LABELS: Record<ImperativePerson, { cz: string; uk: string }> = {
  ty: { cz: "ty", uk: "ти" },
  vy: { cz: "vy", uk: "ви" },
  my: { cz: "my", uk: "ми (закличне)" },
};

// Форма наказового способу для особи (null, якщо дієслово його не має).
export function imperativeForm(v: VerbEntry, p: ImperativePerson): string | null {
  if (!v.imperative) return null;
  return v.imperative[p];
}
