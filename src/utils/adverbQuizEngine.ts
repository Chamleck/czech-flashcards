import { SpatialAdverbEntry, AdverbSense, SpatialRole } from "../types";
import { ADVERBS } from "../data/adverbs";
import { INTERROGATIVE_ADVERBS, rolesOf, spatialQuestion } from "../data/interrogativeAdverbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
import { capitalize, firstForm, once, randomOf, shuffle } from "./quizCommon";

// Квиз прислівників місця. ДВА напрями в одному раунді:
// • forward — за контекстним реченням із пропуском і підказкою ролі (де? / куди? / звідки? / кудою?) обрати форму
//   концепту. Дистрактор — інша форма ТОГО САМОГО слова (vlevo / doleva / zleva) з іншою роллю: роль, не лексика, —
//   навичка, що перевіряється. Кросс-лемних дистракторів нема свідомо: фрейм «Jsem ___» граматично приймає майже
//   будь-який прислівник місця. Речення — приклади картки; однозначність тримає підказка ролі в завданні.
// • reverse — дано ПОВНЕ речення з реальною формою-відповіддю (без пропуску), обрати, на яке ПИТАННЯ
//   (kde / kam / odkud / kudy) вона відповідає. Лише для форми з ОДНИМ питанням (tam — і kde, і kam: дві правильні).
//
// Ролі форм — дані (AdverbSense.asks), питальні слова й підказки — data/interrogativeAdverbs.ts; у рушії немає ні
// текстів підписів, ні самих слів kde / kam / odkud / kudy. Той самий контракт полів, що й у решти рушіїв.
export interface AdverbQuestion {
  comboId: string;
  promptWord: string; // forward: концепт українською ("ліворуч"); reverse: слово-носій ("zleva")
  promptUk: string; // порожній в обох напрямах (екран гардить "" як falsy)
  promptLabel: string; // частина мови тестованого слова ("прислівник")
  taskText: string;
  contextPhrase?: string; // forward: речення з пропуском ___; reverse: повне речення без пропуску
  correct: string;
  options: string[]; // [правильна, дистрактор] — перемішані
}

const REV_TASK = "На яке питання відповідає?";
const PROMPT_LABEL = "прислівник";

// Замінити форму в реченні на пропуск ___. Потокенно, а НЕ str.replace(form):
// (1) форма на початку речення пишеться з великої ("Vevnitř je teplo") — простий
//     replace нижнім регістром її не знайшов би (реальний баг, спійманий harness'ом);
// (2) потокенне порівняння уникає збігу форми ВСЕРЕДИНІ довшого слова (tam ⊂
//     odtamtud). \p{L}+ (Unicode) коректно відділяє літери від пунктуації і
//     працює з чеською діакритикою (ASCII-\b тут ламається на ř/ě).
function blankOut(sentence: string, form: string): string | null {
  const target = form.toLowerCase();
  const tokens = sentence.split(" ");
  for (let i = 0; i < tokens.length; i++) {
    const m = tokens[i].match(/^(\p{L}+)(.*)$/u);
    if (m && m[1].toLowerCase() === target) {
      tokens[i] = "___" + m[2]; // зберігаємо хвостову пунктуацію (крапку тощо)
      return tokens.join(" ");
    }
  }
  return null; // форми в реченні немає — такий приклад квіз не бере (правило 3 у data/adverbs.ts)
}

// Підказка прямого питання: роль форми (для tam — обидва питання: «Де? / Куди?»).
function forwardTask(sense: AdverbSense): string {
  const roles = rolesOf(sense);
  return roles.length === 1
    ? spatialQuestion(roles[0]).quizHint
    : roles.map((r) => capitalize(firstForm(spatialQuestion(r).uk))).join(" / ");
}

// Комбо = (запис, сенс, напрям). direction розділяє forward/reverse — це різні навички (форма за роллю vs питання
// за формою), тому окремі comboId і окремі слоти у вазі помилок. comboId — за стабільною частиною (слово + роль +
// напрям), не за прикладом-реченням: id пулу й питання мусять збігатися, інакше ваги помилок не працюють. Роль
// forward-комбо — перша з asks (tam: loc — як до переходу на ролі).
interface Combo {
  id: string;
  entry: SpatialAdverbEntry;
  sense: AdverbSense;
  role: SpatialRole;
  direction: "fwd" | "rev";
}

const others = (c: Combo) => c.entry.senses.filter((s) => s !== c.sense && !rolesOf(s).some((r) => rolesOf(c.sense).includes(r)));
const blankable = (s: AdverbSense) => s.examples.filter((ex) => blankOut(ex.cz, s.cz) !== null);

function enumerateCombos(pool: SpatialAdverbEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const entry of pool) {
    for (const sense of entry.senses) {
      const roles = rolesOf(sense);
      if (roles.length === 0) continue; // форма без питання (rovně)
      const fwd: Combo = { id: comboId(entry.id, roles[0], "x"), entry, sense, role: roles[0], direction: "fwd" };
      if (others(fwd).length > 0 && blankable(sense).length > 0) combos.push(fwd);
      if (roles.length === 1 && blankable(sense).length > 0) combos.push({ id: comboId(entry.id, roles[0], "rev"), entry, sense, role: roles[0], direction: "rev" });
    }
  }
  return combos;
}

// Пул комбінацій залежить лише від даних — будується раз за запуск застосунку.
const defaultCombos = once(() => enumerateCombos(ADVERBS));

function makeForwardQuestion(c: Combo): AdverbQuestion {
  // Фрейм — випадковий приклад цього сенсу; РІВНО ОДИН дистрактор — випадкова інша форма слова з іншою роллю.
  const ex = randomOf(blankable(c.sense))!;
  const distractor = randomOf(others(c))!.cz;
  return {
    comboId: c.id,
    promptWord: c.entry.uk,
    promptUk: "",
    promptLabel: PROMPT_LABEL,
    taskText: forwardTask(c.sense),
    contextPhrase: blankOut(ex.cz, c.sense.cz)!,
    correct: c.sense.cz,
    options: shuffle([c.sense.cz, distractor]),
  };
}

function makeReverseQuestion(c: Combo): AdverbQuestion {
  // Повне речення (БЕЗ пропуску) — форма-відповідь уже стоїть у ньому. Варіанти — питальні слова ролей.
  const ex = randomOf(blankable(c.sense))!;
  const correct = spatialQuestion(c.role).cz;
  const distractor = randomOf(INTERROGATIVE_ADVERBS.filter((q) => q.role !== c.role))!.cz;
  return {
    comboId: c.id,
    promptWord: c.sense.cz, // слово-носій з речення (zleva), не концепт
    promptUk: "",
    promptLabel: PROMPT_LABEL,
    taskText: REV_TASK,
    contextPhrase: ex.cz,
    correct,
    options: shuffle([correct, distractor]),
  };
}

function makeQuestion(c: Combo): AdverbQuestion {
  return c.direction === "rev" ? makeReverseQuestion(c) : makeForwardQuestion(c);
}

// Баланс за роллю/напрямом у раунді: floor на кожну forward-роль де? / куди? / звідки? + невеликий floor на reverse
// тих самих ролей (щоб reverse не тонув у численнішому forward-пулі). «Кудою?» (path, лише tudy / tamtudy) — СВІДОМО
// без floor в обох напрямах: випадає органічно рідко, як і в мовленні.
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
  const combos = pool === ADVERBS ? defaultCombos() : enumerateCombos(pool);
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.entry.id, undefined, ADVERB_KIND_QUOTA);
  return chosen.map(makeQuestion);
}
