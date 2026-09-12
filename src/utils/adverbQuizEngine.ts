import { SpatialAdverbEntry, AdverbSense } from "../types";
import { ADVERBS } from "../data/adverbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// Квиз прислівників місця: за контекстним реченням (з пропуском) визначити, яка
// з форм концепту підходить — де? / куди? / звідки?. Дистрактор — ЗАВЖДИ інша
// форма ТОГО САМОГО концепту (vlevo/doleva/zleva), бо саме роль (а не лексичне
// значення) — навичка, що перевіряється. Кросс-лемних дистракторів нема свідомо:
// фрейм «Jsem ___» граматично приймає майже будь-який прислівник місця, тож чужа
// лема була б валідним реченням, а не чистим «неправильним» варіантом.
//
// Той самий контракт полів, що й у решти движків, — екран квізу не змінюється.
export interface AdverbQuestion {
  entry: SpatialAdverbEntry;
  role: AdverbRole;
  comboId: string;
  promptWord: string; // концепт українською, напр. "ліворуч" — headline-слот
  promptUk: string; // порожній: концепт уже в promptWord (екран гардить "" як falsy)
  promptLabel: string; // заголовок-підпис: частина мови ("прислівник")
  taskText: string;
  contextPhrase?: string; // чеське речення з пропуском ___
  correct: string;
  options: string[]; // [правильна, дистрактор] — перемішані (2 варіанти, як усюди)
}

// Просторова роль = грамматична конструкція теми. kind для kindQuota.
type AdverbRole = "loc" | "dir" | "orig";

// Маппінг за ТЕКСТОМ лейбла сенсу (закритий набір, як accentForLabel у AdverbCard
// Фази 13 — надійніше за позицію в масиві: tam має нестандартний набір сенсів).
// "напрямок" (rovně) свідомо не мапиться — цей запис виключений з квізу (див.
// нижче: єдиний сенс, контрастувати нема з чим, як вокатив у склонінні).
const ROLE_BY_LABEL: Record<string, AdverbRole> = {
  "де?": "loc",
  "куди?": "dir",
  "звідки?": "orig",
  "де? / куди?": "loc", // tam: одна форма на де+куди — рахуємо як статичну
};

const ROLE_TASK: Record<AdverbRole, string> = {
  loc: "Де? (стан, без руху)",
  dir: "Куди? (рух ДО місця)",
  orig: "Звідки? (рух ВІД місця)",
};

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

// Комбо = (запис, сенс). Тестовний лише запис із ≥2 сенсами (є з чим контрастувати):
// тройки — 3, tam/doma — 2, rovně (1 сенс) виключений повністю.
interface Combo {
  id: string;
  entry: SpatialAdverbEntry;
  sense: AdverbSense;
  role: AdverbRole;
}

function enumerateCombos(pool: SpatialAdverbEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const entry of pool) {
    if (entry.senses.length < 2) continue; // rovně — контрастувати нема з чим
    for (const sense of entry.senses) {
      const role = ROLE_BY_LABEL[sense.label];
      if (!role) continue; // невідомий лейбл — не мапимо мовчки в неправильну роль
      // comboId — по СТАБІЛЬНІЙ частині (entryId + role), НЕ по конкретному
      // прикладу-фрейму (його обираємо випадково в makeQuestion). Інакше id пулу
      // і id реального питання розійшлись би — веги помилок перестали б працювати.
      combos.push({ id: comboId(entry.id, role, "x"), entry, sense, role });
    }
  }
  return combos;
}

function makeQuestion(c: Combo): AdverbQuestion {
  // Фрейм — випадковий приклад цього сенсу (у tam/doma їх 2 → різноманіття).
  const ex = c.sense.examples[Math.floor(Math.random() * c.sense.examples.length)];
  const blanked = blankOut(ex.cz, c.sense.cz);

  // РІВНО ОДИН дистрактор — та сама конвенція, що й у ВСІХ інших движків
  // застосунку (Іменники/Дієслова/Прикметники/Числівники/Час/Прийменники —
  // усюди 2 варіанти, жодного винятку; contract-коментар у VerbQuestion теж
  // прямо каже "[правильна, дистрактор]", однина). У повних трійках (де є 2
  // інших сенси) обираємо ОДИН з них випадково — форма реальна (не вигадана),
  // просто не всі альтернативи одночасно. tam/doma (лише 1 інший сенс) —
  // без змін, там і так було 2.
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

// Баланс просторових ролей у раунді: floor на кожну, щоб жодна конструкція
// (де/куди/звідки) не зникала з раунду. Числа підібрані емпірично harness'ом
// (6/12 зарезервовано — лишає місце mistake-слотам, не переобтяжує квоту).
const ADVERB_KIND_QUOTA: KindQuota<string> = {
  kindOf: (c) => (c as Combo).role,
  minSlots: { loc: 2, dir: 2, orig: 2 },
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
