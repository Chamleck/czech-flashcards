// Структурований контент розділу "Граматика".
// Кожна тема складається з блоків, які рендерить GrammarTopicScreen.
// Блоки типізовані — легко додавати нові теми без зміни коду екрана.

export type GrammarBlock =
  | { type: "paragraph"; text: string }
  | { type: "cases" } // рендерить таблицю 7 відмінків із контрольними питаннями
  | { type: "patterns" } // рендерить згруповані зразки відмінювання
  | { type: "tip"; text: string }
  | { type: "list"; items: { term: string; note: string }[] };

export interface GrammarTopic {
  id: string;
  emoji: string;
  title: string; // українською
  subtitle: string;
  ready: boolean; // false → тема ще в розробці (позначка 🔒)
  blocks: GrammarBlock[];
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "gender-number",
    emoji: "⚥",
    title: "Рід і число",
    subtitle: "4 роди, однина й множина",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "У чеській мові чотири роди. Чоловічий рід додатково ділиться на істоти (люди, тварини) та неістоти (предмети) — це впливає на відмінювання, особливо на знахідний відмінок.",
      },
      {
        type: "list",
        items: [
          { term: "🧑 Чоловічий істот.", note: "muž, student, pán — закінчення часто на приголосний" },
          { term: "🪑 Чоловічий неістот.", note: "hrad, stůl, stroj — теж на приголосний, але Asg = Nsg" },
          { term: "🌸 Жіночий", note: "žena, růže, kost — часто на -a, -e або приголосний" },
          { term: "☀️ Середній", note: "město, moře, kuře — часто на -o, -e, -í" },
        ],
      },
      {
        type: "paragraph",
        text: "Число буває однина (jednotné číslo) і множина (množné číslo). Кожен відмінок має окрему форму для однини та множини — тому повна парадигма іменника це 7 × 2 = 14 форм.",
      },
      {
        type: "tip",
        text: "💡 Щоб визначити рід незнайомого слова — дивись на закінчення називного відмінка й перевіряй за словником. Рід у чеській та українській часто збігається, але не завжди (напр. чеське 'to auto' — середній рід).",
      },
    ],
  },
  {
    id: "seven-cases",
    emoji: "📚",
    title: "Сім відмінків",
    subtitle: "Контрольні питання до кожного",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Чеська має 7 відмінків. На кожен є контрольне питання — по ньому легше визначити потрібну форму в реченні.",
      },
      { type: "cases" },
      {
        type: "tip",
        text: "💡 Кличний відмінок (5.) в українській теж є (мамо, Петре) — використовується при звертанні. У чеській він активний у щоденному мовленні: 'Pane!', 'Petře!'.",
      },
    ],
  },
  {
    id: "patterns",
    emoji: "🗂️",
    title: "Зразки відмінювання",
    subtitle: "11 базових взорів",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Кожен іменник відмінюється за одним із зразків (взорів). Знаючи рід і зразок — можеш побудувати всі 14 форм слова. Зразок визначають за родом і за тим, тверда чи м'яка основа (за останнім приголосним).",
      },
      { type: "patterns" },
      {
        type: "tip",
        text: "💡 Порада: спочатку визнач рід і чи слово тверде/м'яке. Це одразу звужує зразок до 1–2 варіантів, і далі легко підставити закінчення.",
      },
    ],
  },
  {
    id: "verbs",
    emoji: "🏃",
    title: "Дієслова",
    subtitle: "Часи та дієвідміни",
    ready: false,
    blocks: [
      {
        type: "paragraph",
        text: "Розділ у розробці. Тут з'являться теперішній, минулий і майбутній час, а також дієвідміни за особами й числами.",
      },
    ],
  },
  {
    id: "pronouns",
    emoji: "👤",
    title: "Займенники",
    subtitle: "Особові, присвійні, вказівні",
    ready: false,
    blocks: [
      {
        type: "paragraph",
        text: "Розділ у розробці. Особові (já, ty, on), присвійні (můj, tvůj) та вказівні (ten, ta, to) займенники з відмінюванням.",
      },
    ],
  },
  {
    id: "prepositions",
    emoji: "🔗",
    title: "Прийменники",
    subtitle: "Який відмінок вимагає кожен",
    ready: false,
    blocks: [
      {
        type: "paragraph",
        text: "Розділ у розробці. Прийменники (v, na, do, k, s, o…) та відмінки, яких вони вимагають.",
      },
    ],
  },
  {
    id: "numbers-dates",
    emoji: "🔢",
    title: "Числівники й дати",
    subtitle: "Числа, дні, місяці",
    ready: false,
    blocks: [
      {
        type: "paragraph",
        text: "Розділ у розробці. Кількісні та порядкові числівники, дні тижня, місяці й побудова дат.",
      },
    ],
  },
];

export const GRAMMAR_BY_ID: Record<string, GrammarTopic> = GRAMMAR_TOPICS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, GrammarTopic>
);
