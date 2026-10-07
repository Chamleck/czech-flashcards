import { CzechCase, Gender, GrammaticalNumber, NounEntry, NounFilter } from "../types";
import type { NounTag } from "../data/nounTags";
import { CLUSTER_RULES, MEST_RULE, Needs, NumberPolicy, VocalDecision, VocalPrep } from "../data/prepositionPartners";

// ─────────────── Чисті допоміжні функції добору партнерів (без випадковості, крім candidateNumbers) ───────────────
// Дані — data/prepositionPartners.ts, теги — data/nounTags.ts, квіз — prepositionQuizEngine.ts.

// Чи підходить слово під вимогу фрейму (any — хоча б один тег, all — усі, none — жодного; порожня вимога —
// будь-яке слово).
export function matchesNeeds(n: NounEntry, needs: Needs): boolean {
  const sem = n.sem ?? [];
  if (needs.none && needs.none.some((t) => sem.includes(t))) return false;
  if (needs.all && !needs.all.every((t) => sem.includes(t))) return false;
  if (needs.any && !needs.any.some((t) => sem.includes(t))) return false;
  return true;
}

// Те саме для вимоги квізу «Прикметники та займенники» (NounFilter): теги + countable (лише злічувані іменники).
export function matchesFilter(n: NounEntry, f: NounFilter): boolean {
  if (f.countable && n.uncountable) return false;
  return matchesNeeds(n, f);
}

// Рід, з яким узгоджуються прикметник і займенник: у множині děti / oči / uši — жіночий (plGender), інакше рід слова.
export function agreementGender(n: NounEntry, num: GrammaticalNumber): Gender {
  return num === "pl" && n.plGender ? n.plGender : n.gender;
}

// Скільки фраз (чи пулів) банку квізу підходить слову — fit для ваги 1 / fit у freshWeightedOrder; мінімум 1.
export function fitCounts<F>(nouns: readonly NounEntry[], frames: readonly F[], fits: (n: NounEntry, f: F) => boolean): Map<string, number> {
  return new Map(nouns.map((n) => [n.id, Math.max(1, frames.filter((f) => fits(n, f)).length)]));
}

// Порядок перебору кандидатів (спільний для квізів): спершу ті, кого ще не було в раунді, всередині — зважена
// випадкова вибірка без повернень (ключ u^fit, Efraimidis–Spirakis), тож імовірність бути першим ∝ 1 / fit. Перебір
// повний: якщо придатні лише вже використані, береться один із них — питання не губиться.
export function freshWeightedOrder<T>(items: T[], isUsed: (t: T) => boolean, fitOf: (t: T) => number): T[] {
  return items
    .map((t) => ({ t, fresh: isUsed(t) ? 0 : 1, key: Math.random() ** fitOf(t) }))
    .sort((a, b) => b.fresh - a.fresh || b.key - a.key)
    .map((x) => x.t);
}

// Множина природна не завжди: «po obědech», «do týdnů», «od rodin» звучать дивно — тому теги часу, погоди, їжі-події,
// занять і збірних за замовчуванням лише в однині. NO_PLURAL — слова, множина яких неприродна в УСІХ квізах (і в
// «Відмінках», де число вирішують фрази): збірні (rodina — множину відкриває лише plOk фрази) і система, одна в місті (metro). Фраза, де множина таких слів природна («při cestách», «Zaplatil jsem
// za obědy»), відкриває її сама полем plOk (теги, напр. recurring / timeUnit) — див. candidateNumbers.
export const NO_PLURAL: NounTag[] = ["collective", "oneSystem"];
// Слова, яких не буває кілька (oneSystem — metro): ні множини, ні лічби; квіз «Числівники» їх не бере («dvě metra» — ні).
// Збірні (rodina) рахуються: «dvě rodiny».
export const onlyOne = (n: NounEntry) => (n.sem ?? []).includes("oneSystem");
const SINGULAR_ONLY: NounTag[] = ["meal", "weather", "activity", "time", ...NO_PLURAL];
export function pluralNatural(n: NounEntry): boolean {
  return !n.uncountable && !(n.sem ?? []).some((t) => SINGULAR_ONLY.includes(t));
}

// Чи має слово це число (клітинка називного не «—»); лише множина — peníze, brýle, kalhoty.
export const hasNumber = (n: NounEntry, num: GrammaticalNumber) => n.declension.nominativ[num] !== "—";
export const pluralOnly = (n: NounEntry) => !hasNumber(n, "sg") && hasNumber(n, "pl");

// Які числа можна взяти для слова за політикою фрейму, у ВИПАДКОВОМУ порядку (перебирає той, хто викликає:
// якщо перше число не дає контрасту форм, пробуємо друге — слово не карається за невдалий жереб).
// Слово лише з множиною (peníze, brýle) і парна річ (boty, ponožky — тег paired) беруть множину навіть у «sg»-фреймі;
// у «pl»-фреймі непридатне слово без множини або з неприродною множиною (pluralNatural). plOk фрейму — теги, для яких
// У ЦІЙ фразі множина природна, хоча загальне правило її не дає («při cestách» — recurring, «celé dny» — timeUnit).
// Тег із plOk — явне рішення, тож відкриває множину й незлічуваному («silné větry», «minerální vody»); так само в
// усіх квізах (рушій «Відмінки» — pluralFits).
export function candidateNumbers(n: NounEntry, policy: NumberPolicy, rnd: () => number = Math.random, plOk?: readonly NounTag[]): GrammaticalNumber[] {
  const sg = hasNumber(n, "sg");
  const pl = hasNumber(n, "pl");
  const natural = pluralNatural(n) || (!!plOk && (n.sem ?? []).some((t) => plOk.includes(t))); // тег із plOk — явне рішення, навіть для незлічуваного
  if (policy === "pl") return pl && (natural || !sg) ? ["pl"] : []; // не «mezi rodinami», не «mezi oblečeními»
  if (!sg || (pl && (n.sem ?? []).includes("paired"))) return pl ? ["pl"] : [];
  if (policy === "sg" || !pl || !natural) return ["sg"];
  return rnd() < 0.5 ? ["sg", "pl"] : ["pl", "sg"];
}

// Форма клітинки, яку показуємо як правильну (перша з «a / b»); null, якщо клітинки немає.
export function formOf(n: NounEntry, c: CzechCase, num: GrammaticalNumber): string | null {
  const cell = n.declension[c][num];
  if (!cell || cell === "—") return null;
  return cell.split(" / ")[0].trim();
}

// ВСІ прийнятні форми клітинки: усі дублети + `variants` (форми, яких не показуємо на картці, але які квіз не
// може подавати як помилку).
export function acceptedForms(n: NounEntry, c: CzechCase, num: GrammaticalNumber): string[] {
  const cell = n.declension[c][num];
  const base = !cell || cell === "—" ? [] : cell.split(" / ").map((s) => s.trim());
  return [...base, ...(n.variants?.[c]?.[num] ?? [])];
}

export function disjoint(a: string[], b: string[]): boolean {
  return !a.some((x) => b.includes(x));
}

// ─────────────── Вокалізація (v→ve, k→ke, s→se, z→ze) ───────────────
const VOWELS = "aáeéěiíoóuúůyý";

// Початкова група приголосних слова («škola» → «š», «sklenice» → «skl», «chléb» → «chl»).
export function initialCluster(word: string): string {
  const w = word.toLowerCase();
  let i = 0;
  while (i < w.length && !VOWELS.includes(w[i])) i++;
  return w.slice(0, i);
}

// "vocal" — потрібна «ve/ke/se/ze», "plain" — «v/k/s/z», null — не класифіковано (слово у таку фразу не беремо).
export function vocalDecision(prep: VocalPrep, word: string): VocalDecision | null {
  const w = word.toLowerCase();
  if (/^měst/.test(w)) return MEST_RULE[prep] ?? null; // ve městě, ke městu, z města
  const cl = initialCluster(w);
  if (cl === "") return "plain";
  const len = cl.replace(/ch/g, "x").length; // «ch» — одна літера
  if (len === 1) {
    const first = cl[0];
    if (prep === "k") return first === "k" || first === "g" ? "vocal" : "plain";
    if (prep === "v") return first === "v" || first === "f" ? "vocal" : "plain";
    return "szšž".includes(first) ? "vocal" : "plain"; // s, z
  }
  // Правило стосується ПОЧАТКУ групи (hrnku → «hrnk», але правило для «hrn»): шукаємо від найдовшого префікса.
  for (let l = cl.length; l >= 2; l--) {
    const rule = CLUSTER_RULES[cl.slice(0, l)];
    if (rule) return rule[prep] ?? null;
  }
  return null;
}

// Форма прийменника перед словом (з вокалізацією); null — вокалізацію не класифіковано.
export function vocalizedPrep(prep: { cz: string; vocalized?: string }, word: string): string | null {
  if (!prep.vocalized) return prep.cz;
  const d = vocalDecision(prep.cz as VocalPrep, word);
  if (d === null) return null;
  return d === "vocal" ? prep.vocalized : prep.cz;
}

// ─────────────── Вокалізація прийменника у фразі ({v} {k} {s} {z} у даних фраз) ───────────────
export const VOCAL_PREP_TOKEN = /\{([vksz])\}/;

// Одне рішення ve / v для всіх слів (обидві кнопки, перше слово групи); null — хоч одне не класифіковане
// (CLUSTER_RULES) або слова вимагають різного (тоді прийменник підказав би відповідь).
export function sharedVocalDecision(prep: VocalPrep, words: readonly string[]): VocalDecision | null {
  let d: VocalDecision | null = null;
  for (const w of words) {
    const x = vocalDecision(prep, w);
    if (x === null || (d !== null && x !== d)) return null;
    d = x;
  }
  return d;
}

// Підставляє перший {v}/{k}/{s}/{z} фрази як ve / v за словами words; фраза без прийменника — як є; null — не можна.
export function vocalizeSlot(text: string, words: readonly string[]): string | null {
  const m = VOCAL_PREP_TOKEN.exec(text);
  if (!m) return text;
  const d = sharedVocalDecision(m[1] as VocalPrep, words);
  if (d === null) return null;
  return text.replace(m[0], prepFor(m[1] as VocalPrep, d));
}

// Написання прийменника за рішенням: v → ve, k → ke, s → se, z → ze.
function prepFor(prep: VocalPrep, d: VocalDecision): string {
  return d === "vocal" ? `${prep}e` : prep;
}

// «v / ve + група»: правильне написання й протилежне (хибна вокалізація як дистрактор); null — група приголосних
// першого слова не класифікована або вживання коливається (CLUSTER_RULES) — таку форму не тестуємо.
export function vocalizedGroup(prep: VocalPrep, group: string): { right: string; wrong: string } | null {
  const d = vocalDecision(prep, group.split(" ")[0]);
  if (d === null) return null;
  return { right: `${prepFor(prep, d)} ${group}`, wrong: `${prepFor(prep, d === "vocal" ? "plain" : "vocal")} ${group}` };
}
