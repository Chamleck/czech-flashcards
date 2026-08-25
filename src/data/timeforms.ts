// ─────────────────────────── ЧАС ДОБИ ───────────────────────────
// Дві повністю різні системи називання часу (звірено з czechonline.org
// [академ.], mozaika.eu, forendors.cz, blog.mclemon.org):
//
// 1) ФОРМАЛЬНА / 24-год — офіційний контекст (розклади, ТБ, вокзал):
//    просто «година хвилина» без слова hodina: 15:20 → «patnáct dvacet».
//
// 2) РОЗМОВНА / 12-год — побутова, все відлічується ВПЕРЕД до наступної години:
//    • čtvrt na + ЗНАХІДНИЙ кількісного жін. роду наступної години:
//        1:15 → «čtvrt na dvě» (чверть на другу)
//    • půl + РОДОВИЙ порядкового жін. роду наступної години:
//        1:30 → «půl druhé» — АЛЕ виняток: 12:30 → «půl jedné» (не «půl první»!)
//    • tři čtvrtě na + ЗНАХІДНИЙ кількісного жін. наступної години:
//        1:45 → «tři čtvrtě na dvě»
//    • проміжні 5-хвилинки — «za X minut <наступна опорна точка>»:
//        1:25 → «za pět minut půl druhé» (за 5 хв пів другої)
//
// УВАГА: čtvrt/tři čtvrtě беруть кількісне (jednu, dvě, tři…),
// а půl бере ПОРЯДКОВЕ (jedné, druhé, třetí…) — це різні числівники!

// Кількісне жін. роду у ЗНАХІДНОМУ (для čtvrt na / tři čtvrtě na).
// Індекс = «наступна година» 1..12.
const ACC_FEM: Record<number, string> = {
  1: "jednu",
  2: "dvě",
  3: "tři",
  4: "čtyři",
  5: "pět",
  6: "šest",
  7: "sedm",
  8: "osm",
  9: "devět",
  10: "deset",
  11: "jedenáct",
  12: "dvanáct",
};

// Порядкове жін. роду в РОДОВОМУ (для půl). Індекс = «наступна година» 1..12.
// 1 → «jedné» (не «první»!) — усталений виняток.
const GEN_FEM_ORD: Record<number, string> = {
  1: "jedné",
  2: "druhé",
  3: "třetí",
  4: "čtvrté",
  5: "páté",
  6: "šesté",
  7: "sedmé",
  8: "osmé",
  9: "deváté",
  10: "desáté",
  11: "jedenácté",
  12: "dvanácté",
};

// Ціла година в називному: «Je jedna hodina» / «Jsou dvě hodiny» / «Je pět hodin».
// Для розмовної 12-год цілої вживаємо коротку форму (hodina опційна) — беремо
// каноном форму з «hodin(a/y)» для однозначності читання.
const CARD_NOM: Record<number, string> = {
  1: "jedna",
  2: "dvě",
  3: "tři",
  4: "čtyři",
  5: "pět",
  6: "šest",
  7: "sedm",
  8: "osm",
  9: "devět",
  10: "deset",
  11: "jedenáct",
  12: "dvanáct",
};

// Наступна година (12→1 циклічно).
function nextHour12(h12: number): number {
  return h12 === 12 ? 1 : h12 + 1;
}

// Правильне слово hodina/hodiny/hodin за правилом 1 / 2-4 / 5+.
function hodinaWord(n: number): string {
  if (n === 1) return "hodina";
  if (n >= 2 && n <= 4) return "hodiny";
  return "hodin";
}

export interface TimePoint {
  h24: number; // 0..23
  m: number; // 0,15,30,45 + проміжні 5,10,20,25,35,40,50,55
}

// ─────────────── Формальна 24-год ───────────────
// «patnáct dvacet» (15:20). Хвилини читаються як кількісне (просте перелічування).
const CARD_PLAIN: Record<number, string> = {
  0: "nula",
  1: "jedna",
  2: "dvě",
  3: "tři",
  4: "čtyři",
  5: "pět",
  6: "šest",
  7: "sedm",
  8: "osm",
  9: "devět",
  10: "deset",
  11: "jedenáct",
  12: "dvanáct",
  13: "třináct",
  14: "čtrnáct",
  15: "patnáct",
  16: "šestnáct",
  17: "sedmnáct",
  18: "osmnáct",
  19: "devatenáct",
  20: "dvacet",
  21: "dvacet jedna",
  22: "dvacet dva",
  23: "dvacet tři",
};

// Дво-цифрове число 0..59 як просте перелічування (десятки + одиниці).
function plainNumber(n: number): string {
  if (n <= 23) return CARD_PLAIN[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensWord: Record<number, string> = {
    2: "dvacet",
    3: "třicet",
    4: "čtyřicet",
    5: "padesát",
  };
  if (ones === 0) return tensWord[tens];
  return `${tensWord[tens]} ${CARD_PLAIN[ones]}`;
}

// Формальне читання: «година хвилина», без слова hodina.
// Ціла: «Je patnáct hodin» — тут hodina доречна (не 24-цифровий формат).
// Для рівних годин даємо «X hodin(a/y)», для решти — «X Y».
export function formal24(tp: TimePoint): string {
  const h = tp.h24;
  if (tp.m === 0) {
    // ціла година у 24-год форматі: «Je patnáct hodin»
    return `${plainNumber(h)} ${hodinaWord(h === 0 ? 24 : h)}`;
  }
  const mm = tp.m < 10 ? `nula ${CARD_PLAIN[tp.m]}` : plainNumber(tp.m);
  return `${plainNumber(h)} ${mm}`;
}

// ─────────────── Розмовна 12-год ───────────────
// Повертає розмовну фразу (без «Je »/«Jsou » — префікс додає движок за потреби).
export function colloquial12(tp: TimePoint): string | null {
  const h24 = tp.h24;
  const h12raw = h24 % 12;
  const h12 = h12raw === 0 ? 12 : h12raw; // 0/12/24 → 12
  const nh = nextHour12(h12); // наступна година для čtvrt/půl/tři čtvrtě

  // Ціла година.
  if (tp.m === 0) {
    return `${CARD_NOM[h12]} ${hodinaWord(h12)}`;
  }
  // Чверть: 15 хв — «čtvrt na <наступна, ЗНАХІДНИЙ кільк.>»
  if (tp.m === 15) return `čtvrt na ${ACC_FEM[nh]}`;
  // Пів: 30 хв — «půl <наступна, РОДОВИЙ поряд.>»
  if (tp.m === 30) return `půl ${GEN_FEM_ORD[nh]}`;
  // Три чверті: 45 хв — «tři čtvrtě na <наступна, ЗНАХІДНИЙ кільк.>»
  if (tp.m === 45) return `tři čtvrtě na ${ACC_FEM[nh]}`;

  // Проміжні 5-хвилинки: «za X minut <опорна точка>».
  // Опорні точки: čtvrt na nh (15), půl (30), tři čtvrtě na nh (45), ціла nh (60).
  const anchors: { at: number; phrase: string }[] = [
    { at: 15, phrase: `čtvrt na ${ACC_FEM[nh]}` },
    { at: 30, phrase: `půl ${GEN_FEM_ORD[nh]}` },
    { at: 45, phrase: `tři čtvrtě na ${ACC_FEM[nh]}` },
    { at: 60, phrase: `${CARD_NOM[nh]} ${hodinaWord(nh)}` },
  ];
  for (const a of anchors) {
    const diff = a.at - tp.m;
    // Проміжки лише 5 або 10 хв до опорної точки. За правилом 5+ → «minut».
    if (diff === 5 || diff === 10) {
      return `za ${CARD_PLAIN[diff]} minut ${a.phrase}`;
    }
  }
  return null; // некруглі хвилини не покриваємо в квізі
}
