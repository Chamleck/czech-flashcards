import { AdverbSense, SpatialQuestionEntry, SpatialRole } from "../types";
import { firstForm } from "../utils/quizCommon";

// Питальні прислівники місця: kde? / kam? / odkud? / kudy? — незмінна частина
// мови (zájmenná příslovce tázací, czechency.org), без парадигми, тому по
// 4 приклади на слово (той самий компенсаційний паттерн, що й для решти
// незмінюваних питальних слів). Формально ЦЕ ІНШІ слова, ніж їхні відповіді
// (vlevo/tam/tady тощо з adverbs.ts) — kde запитує, vlevo відповідає.
//
// Ці ж слова — правильні відповіді у reverse-квізі adverbQuizEngine.ts
// (кв "Прислівники місця": дано речення-відповідь, обрати яке питання воно
// покриває). Дані тут — для словника/граматики; квіз-логіка окремо.
//
// ПРАВИЛА ДОДАВАННЯ (картка SimpleWordCard, квіз «Прислівники місця»)
//  1. role — ОБОВ'ЯЗКОВЕ: яку просторову роль питає слово (loc — де?, dir — куди?, orig — звідки?, path — кудою?);
//     по ОДНОМУ слову на роль. Сенси прислівників у data/adverbs.ts посилаються на роль (поле asks), а не на текст.
//  2. uk — перша частина до « / » — це підпис сенсу на картці прислівника («де?», «кудою?»).
//  3. quizHint — текст завдання прямого питання квізу («Де? (стан, без руху)»): коротко, українською, роль як
//     контраст до інших (стан / рух до / рух від / маршрут).
//  4. cz — правильна відповідь зворотного питання квізу («На яке питання відповідає?»).
//  5. Перед здачею — оракул scripts/check-quiz-coverage.ts --only=adverbs: «Помилок: 0».

export const INTERROGATIVE_ADVERBS: SpatialQuestionEntry[] = [
  {
    id: "int-kde",
    role: "loc",
    quizHint: "Де? (стан, без руху)",
    cz: "kde",
    uk: "де?",
    examples: [
      { cz: "Kde bydlíš?", uk: "Де ти живеш?" },
      { cz: "Kde je nádraží?", uk: "Де вокзал?" },
      { cz: "Nevím, kde to je.", uk: "Я не знаю, де це." },
      { cz: "Kde se sejdeme?", uk: "Де ми зустрінемось?" },
    ],
  },
  {
    id: "int-kam",
    role: "dir",
    quizHint: "Куди? (рух ДО місця)",
    cz: "kam",
    uk: "куди?",
    examples: [
      { cz: "Kam jdeš?", uk: "Куди ти йдеш?" },
      { cz: "Kam pojedeme na dovolenou?", uk: "Куди ми поїдемо у відпустку?" },
      { cz: "Kam mám dát ten kufr?", uk: "Куди мені поставити цю валізу?" },
      { cz: "Nevím, kam jít.", uk: "Я не знаю, куди йти." },
    ],
  },
  {
    id: "int-odkud",
    role: "orig",
    quizHint: "Звідки? (рух ВІД місця)",
    cz: "odkud",
    uk: "звідки?",
    examples: [
      { cz: "Odkud jsi?", uk: "Звідки ти?" },
      { cz: "Odkud to víš?", uk: "Звідки ти це знаєш?" },
      { cz: "Odkud přijíždí ten vlak?", uk: "Звідки прибуває цей потяг?" },
      { cz: "Odkud se ozval ten zvuk?", uk: "Звідки почувся цей звук?" },
    ],
  },
  {
    id: "int-kudy",
    role: "path",
    quizHint: "Кудою? (маршрут)",
    cz: "kudy",
    uk: "кудою? / яким шляхом?",
    examples: [
      { cz: "Kudy se dostanu na nádraží?", uk: "Яким шляхом мені дістатись до вокзалу?" },
      { cz: "Kudy půjdeme?", uk: "Яким шляхом ми підемо?" },
      { cz: "Nevím, kudy jet.", uk: "Я не знаю, яким шляхом їхати." },
      { cz: "Kudy jedeš do práce?", uk: "Яким шляхом ти їздиш на роботу?" },
    ],
  },
];

// Питальне слово для ролі (рівно одне на роль — правило 1).
export function spatialQuestion(role: SpatialRole): SpatialQuestionEntry {
  const q = INTERROGATIVE_ADVERBS.find((x) => x.role === role);
  if (!q) throw new Error(`Немає питального прислівника для ролі ${role}`);
  return q;
}

// Ролі сенсу як звичайний масив (порожній у rovně).
export const rolesOf = (sense: AdverbSense): readonly SpatialRole[] => sense.asks;

// Підпис сенсу прислівника на картці: питання, на які відповідає форма («де?», «де? / куди?»), або власний label.
export function senseLabel(sense: AdverbSense): string {
  return sense.label ?? rolesOf(sense).map((r) => firstForm(spatialQuestion(r).uk)).join(" / ");
}
