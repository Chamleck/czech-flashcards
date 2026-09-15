import { InvariantWordEntry } from "../types";

// Решта незмінюваних питальних слів — час (kdy), спосіб/причина (jak/proč),
// кількість (kolik). Формально різні частини мови (zájmenné příslovce
// tázací — kdy/jak/proč; zájmeno číslovkové tázací — kolik), але для
// розділу "Питальні слова" об'єднані як "Інші" — жодна наявна тема
// (Прислівники місця, Числівники) не підходить як дім для одного слова,
// а самостійну міні-тему заради одного-чотирьох слів заводити нераціонально
// (узгоджено окремо).
//
// БЕЗ КВІЗУ (узгоджено): жодного механізму для тестування цих слів немає —
// kdy/jak/proč — прозорі когнати (коли/як/чому), розрізняти в multiple-choice
// нема що; kolik керує родовим множини так само, як pět+ (numeralAgreementEngine
// вже тестує САМЕ ЦЕЙ навик на числівниках — дублювати немає сенсу). Лише
// словник (4 приклади — компенсація відсутньої парадигми) + граматика.
export const INTERROGATIVE_MISC: InvariantWordEntry[] = [
  {
    id: "int-kdy",
    cz: "kdy",
    uk: "коли?",
    examples: [
      { cz: "Kdy přijedeš?", uk: "Коли ти приїдеш?" },
      { cz: "Kdy začíná film?", uk: "Коли починається фільм?" },
      { cz: "Nevím, kdy to bude.", uk: "Я не знаю, коли це буде." },
      { cz: "Kdy máš narozeniny?", uk: "Коли в тебе день народження?" },
    ],
  },
  {
    id: "int-jak",
    cz: "jak",
    uk: "як?",
    examples: [
      { cz: "Jak se máš?", uk: "Як справи?" },
      { cz: "Jak to funguje?", uk: "Як це працює?" },
      { cz: "Jak dlouho tu bydlíš?", uk: "Як довго ти тут живеш?" },
      { cz: "Nevím, jak to říct.", uk: "Я не знаю, як це сказати." },
    ],
  },
  {
    id: "int-proc",
    cz: "proč",
    uk: "чому?",
    examples: [
      { cz: "Proč jsi smutný?", uk: "Чому ти сумний?" },
      { cz: "Proč to děláš?", uk: "Чому ти це робиш?" },
      { cz: "Nevím, proč nepřišel.", uk: "Я не знаю, чому він не прийшов." },
      { cz: "Proč ne?", uk: "Чому б і ні?" },
    ],
  },
  {
    id: "int-kolik",
    cz: "kolik",
    uk: "скільки?",
    examples: [
      // jablek/lidí — навмисно родовий множини (kolik керує ним так само, як
      // pět+, ÚJČ-джерела підтверджують: genitiv numerativní).
      { cz: "Kolik je hodin?", uk: "Котра година?" },
      { cz: "Kolik to stojí?", uk: "Скільки це коштує?" },
      { cz: "Kolik jablek chceš?", uk: "Скільки яблук ти хочеш?" },
      { cz: "Kolik lidí přišlo?", uk: "Скільки людей прийшло?" },
    ],
  },
];
