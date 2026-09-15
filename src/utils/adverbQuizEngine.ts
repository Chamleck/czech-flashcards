import { SpatialAdverbEntry, AdverbSense } from "../types";
import { ADVERBS } from "../data/adverbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// Квиз прислівників місця. ДВА напрями в одному раунді:
// • forward (як було) — за контекстним реченням із пропуском визначити, яка
//   з форм концепту підходить (де?/куди?/звідки?). Дистрактор — інша форма
//   ТОГО САМОГО концепту (vlevo/doleva/zleva) — роль, не лексика, навичка,
//   що перевіряється. Кросс-лемних дистракторів нема свідомо: фрейм «Jsem
//   ___» граматично приймає майже будь-який прислівник місця, тож чужа лема
//   була б валідним реченням, а не чистим «неправильним» варіантом.
// • reverse (нове) — дано ПОВНЕ речення з реальною формою-відповіддю (без
//   пропуску), обрати, на яке ПИТАННЯ (kde/kam/odkud/kudy) вона відповідає.
//   Це і є навчання самих питальних слів kde/kam/odkud/kudy — вони існують
//   лише як правильна відповідь reverse-питання, forward їх не тестує.
//
// Той самий контракт полів, що й у решти движків, — екран квізу не змінюється.
export interface AdverbQuestion {
  entry: SpatialAdverbEntry;
  role: AdverbRole;
  comboId: string;
  promptWord: string; // forward: концепт українською ("ліворуч"); reverse: слово-носій ("zleva")
  promptUk: string; // порожній в обох напрямах — переклад уже в promptWord/пояснюється контекстом (екран гардить "" як falsy)
  promptLabel: string; // заголовок-підпис: частина мови ("прислівник") — тестованого слова
  taskText: string;
  contextPhrase?: string; // forward: речення з пропуском ___; reverse: повне речення без пропуску
  correct: string;
  options: string[]; // [правильна, дистрактор] — перемішані (2 варіанти, як усюди)
}

// Просторова роль = грамматична конструкція теми. "path" — кудою? (шлях,
// tudy/tamtudy) — лише reverse (forward для path НЕ генерується, бо
// forward-мапа ROLE_BY_LABEL свідомо не знає лейбл "кудою?", див. нижче).
// kind для kindQuota.
type AdverbRole = "loc" | "dir" | "orig" | "path";

// Маппінг за ТЕКСТОМ лейбла сенсу (закритий набір, як accentForLabel у AdverbCard
// Фази 13 — надійніше за позицію в масиві: tam має нестандартний набір сенсів).
// FORWARD-мапа: "напрямок" (rovně) і "кудою?" (tudy/tamtudy) свідомо НЕ
// мапляться — обидва виключені з forward-квізу (rovně: єдиний сенс, нема з
// чим контрастувати; кудою?: тестується лише в reverse, див. нижче).
const ROLE_BY_LABEL: Record<string, AdverbRole> = {
  "де?": "loc",
  "куди?": "dir",
  "звідки?": "orig",
  "де? / куди?": "loc", // tam: одна форма на де+куди — рахуємо як статичну
};

// REVERSE-мапа: окрема від forward. "кудою?" з'являється ТУТ (path) — форма
// шляху тестується лише в reverse. "де? / куди?" (tam) НАВМИСНЕ відсутня:
// reverse питає "яке ОДНЕ питання це речення покриває", а tam відповідає
// ОДНОЧАСНО на kde і kam — чесної відповіді з ОДНИМ правильним варіантом тут
// нема (на відміну від forward, де форма tam однозначна незалежно від того,
// яке з двох питань малось на увазі). Тому tam просто виключений з reverse —
// той самий принцип виключення, що rovně з forward.
const REV_ROLE_BY_LABEL: Record<string, AdverbRole> = {
  "де?": "loc",
  "куди?": "dir",
  "звідки?": "orig",
  "кудою?": "path",
};

const ROLE_TASK: Record<AdverbRole, string> = {
  loc: "Де? (стан, без руху)",
  dir: "Куди? (рух ДО місця)",
  orig: "Звідки? (рух ВІД місця)",
  path: "Кудою? (маршрут)", // forward це не генерує (path — лише reverse), але Record має бути повним
};

// Канонічні питальні слова — це і є правильні відповіді reverse-питань.
const ROLE_WORD: Record<AdverbRole, string> = {
  loc: "kde",
  dir: "kam",
  orig: "odkud",
  path: "kudy",
};

const REV_TASK = "На яке питання відповідає?";

const PROMPT_LABEL = "прислівник";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Замінити форму в реченні на пропуск ___. Потокенно, а НЕ str.replace(form):
// (1) форма на початку речення пишеться з великої ("Vevnitř je teplo") — простий
//     replace нижнім регістром її не знайшов би (реальний баг, спійманий harness'ом);
// (2) потокенне порівняння уникає збігу форми ВСЕРЕДИНІ довшого слова (tam ⊂
//     odtamtud). \p{L}+ (Unicode) коректно відділяє літери від пунктуації і
//     працює з чеською діакритикою (ASCII-\b тут ламається на ř/ě).
function blankOut(sentence: string, form: string): string {
  const target = form.toLowerCase();
  const tokens = sentence.split(" ");
  for (let i = 0; i < tokens.length; i++) {
    const m = tokens[i].match(/^(\p{L}+)(.*)$/u);
    if (m && m[1].toLowerCase() === target) {
      tokens[i] = "___" + m[2]; // зберігаємо хвостову пунктуацію (крапку тощо)
      return tokens.join(" ");
    }
  }
  return sentence; // не мало б статись: harness перевіряє повне покриття
}

// Комбо = (запис, сенс, напрям). direction розділяє forward/reverse НАВІТЬ
// для однієї й тієї самої пари (entry, role) — це різні навички (форма за
// роллю vs питання за формою), тому окремі comboId і окремі слоти в вазі
// помилок (мовчазне змішування двох навичок під одним id — те саме
// клас багу, що 0.2/5 замість 5/5 при неузгодженому форматі comboId).
interface Combo {
  id: string;
  entry: SpatialAdverbEntry;
  sense: AdverbSense;
  role: AdverbRole;
  direction: "fwd" | "rev";
}

function enumerateCombos(pool: SpatialAdverbEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const entry of pool) {
    if (entry.senses.length < 2) continue; // rovně — контрастувати нема з чим (forward і reverse обидва)
    for (const sense of entry.senses) {
      // comboId — по СТАБІЛЬНІЙ частині (entryId + role + напрям), НЕ по
      // конкретному прикладу-фрейму (його обираємо випадково в makeQuestion).
      // Інакше id пулу і id реального питання розійшлись би — веги помилок
      // перестали б працювати.
      const fwdRole = ROLE_BY_LABEL[sense.label];
      if (fwdRole) {
        combos.push({ id: comboId(entry.id, fwdRole, "x"), entry, sense, role: fwdRole, direction: "fwd" });
      }
      const revRole = REV_ROLE_BY_LABEL[sense.label];
      if (revRole) {
        combos.push({ id: comboId(entry.id, revRole, "rev"), entry, sense, role: revRole, direction: "rev" });
      }
    }
  }
  return combos;
}

function makeForwardQuestion(c: Combo): AdverbQuestion {
  // Фрейм — випадковий приклад цього сенсу (у tam/doma їх 2 → різноманіття).
  const ex = c.sense.examples[Math.floor(Math.random() * c.sense.examples.length)];
  const blanked = blankOut(ex.cz, c.sense.cz);

  // РІВНО ОДИН дистрактор — та сама конвенція, що й у ВСІХ інших движків
  // застосунку (Іменники/Дієслова/Прикметники/Числівники/Час/Прийменники —
  // усюди 2 варіанти, жодного винятку). У повних трійках (де є 2 інших
  // сенси) обираємо ОДИН з них випадково — форма реальна (не вигадана),
  // просто не всі альтернативи одночасно. tam/doma (лише 1 інший сенс) —
  // без змін, там і так було 2.
  //
  // ПРИМІТКА: у tady/tam серед "інших сенсів" тепер може трапитись і сенс
  // "кудою?" (tudy/tamtudy) — форвард-комбо для нього НЕ генерується (див.
  // ROLE_BY_LABEL вище), але як дистрактор для де?/куди?/звідки? він цілком
  // може випасти. Це навмисно нешкідливо: tudy — реальне слово тієї самої
  // леми, просто ще одна форма "неправильної" відповіді, не вигадана.
  const others = c.entry.senses.filter((s) => s !== c.sense).map((s) => s.cz);
  const distractor = others[Math.floor(Math.random() * others.length)];
  const options = shuffle([c.sense.cz, distractor]);

  return {
    entry: c.entry,
    role: c.role,
    comboId: c.id,
    promptWord: c.entry.uk,
    promptUk: "",
    promptLabel: PROMPT_LABEL,
    taskText: ROLE_TASK[c.role],
    contextPhrase: blanked,
    correct: c.sense.cz,
    options,
  };
}

function makeReverseQuestion(c: Combo): AdverbQuestion {
  // Повне речення (БЕЗ пропуску) — сама форма-відповідь уже стоїть у ньому.
  const ex = c.sense.examples[Math.floor(Math.random() * c.sense.examples.length)];

  // Дистрактор — інше з чотирьох канонічних питальних слів (не обов'язково
  // з сенсів ЦЬОГО запису, як у forward: тут варіанти — самі АБСТРАКТНІ
  // питальні слова kde/kam/odkud/kudy, а не форми-відповіді, тож повний
  // канонічний набір коректний незалежно від того, скільки сенсів має цей
  // конкретний запис).
  const otherRoles = (Object.keys(ROLE_WORD) as AdverbRole[]).filter((r) => r !== c.role);
  const distractorRole = otherRoles[Math.floor(Math.random() * otherRoles.length)];
  const correct = ROLE_WORD[c.role];
  const options = shuffle([correct, ROLE_WORD[distractorRole]]);

  return {
    entry: c.entry,
    role: c.role,
    comboId: c.id,
    promptWord: c.sense.cz, // слово-носій з речення (zleva), не концепт
    promptUk: "",
    promptLabel: PROMPT_LABEL,
    taskText: REV_TASK,
    contextPhrase: ex.cz, // повне речення, без пропуску
    correct,
    options,
  };
}

function makeQuestion(c: Combo): AdverbQuestion {
  return c.direction === "rev" ? makeReverseQuestion(c) : makeForwardQuestion(c);
}

// Баланс за роллю/напрямом у раунді: floor на кожну forward-роль (як було) +
// невеликий floor на reverse-роль для de?/kam?/odkud? (щоб reverse не тонув у
// численнішому forward-пулі). "path-rev" (kudy) — СВІДОМО без floor: корпус
// для нього лише 2 леми (tudy/tamtudy), тому нехай випадає органічно рідко
// через звичайний зважений пул — імітує реальну частоту вживання, а не
// штучно форсується. Той самий принцип, що виключення rovně з forward: не
// все повинно потрапляти в квіз однаково часто, коли для цього є причина.
const ADVERB_KIND_QUOTA: KindQuota<string> = {
  kindOf: (c) => {
    const combo = c as Combo;
    return combo.direction === "rev" ? `${combo.role}-rev` : combo.role;
  },
  minSlots: { loc: 2, dir: 2, orig: 2, "loc-rev": 1, "dir-rev": 1, "orig-rev": 1 },
};

export function generateAdverbSession(
  count: number,
  pool: SpatialAdverbEntry[] = ADVERBS,
  mistakes: MistakeStore = {}
): AdverbQuestion[] {
  const combos = enumerateCombos(pool);
  const chosen = selectRoundCombos(
    combos,
    mistakes,
    count,
    (c) => c.entry.id,
    undefined,
    ADVERB_KIND_QUOTA
  );
  return chosen.map(makeQuestion);
}
