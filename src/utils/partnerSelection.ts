import { CzechCase, GrammaticalNumber, NounEntry } from "../types";
import type { NounTag } from "../data/nounTags";
import { CLUSTER_RULES, MEST_RULE, Needs, NumberPolicy, VocalDecision, VocalPrep } from "../data/prepositionPartners";

// ─────────────── Чисті допоміжні функції добору партнерів (без випадковості, крім candidateNumbers) ───────────────
// Дані — data/prepositionPartners.ts, теги — data/nounTags.ts, квіз — prepositionQuizEngine.ts.

// Чи підходить слово під вимогу фрейму (any — хоча б один тег, all — усі; порожня вимога — будь-яке слово).
export function matchesNeeds(n: NounEntry, needs: Needs): boolean {
  const sem = n.sem ?? [];
  if (needs.all && !needs.all.every((t) => sem.includes(t))) return false;
  if (needs.any && !needs.any.some((t) => sem.includes(t))) return false;
  return true;
}

// Множина природна не завжди: «po obědech», «při deštích», «do týdnů» звучать дивно.
const SINGULAR_ONLY: NounTag[] = ["meal", "weather", "activity", "time"];
export function pluralNatural(n: NounEntry): boolean {
  return !n.uncountable && !(n.sem ?? []).some((t) => SINGULAR_ONLY.includes(t));
}

const hasNumber = (n: NounEntry, num: GrammaticalNumber) => n.declension.nominativ[num] !== "—";

// Які числа можна взяти для слова за політикою фрейму, у ВИПАДКОВОМУ порядку (перебирає той, хто викликає:
// якщо перше число не дає контрасту форм, пробуємо друге — слово не карається за невдалий жереб).
// Слово лише з множиною (peníze, brýle) бере множину навіть у «sg»-фреймі; слово без множини у «pl»-фреймі непридатне.
export function candidateNumbers(n: NounEntry, policy: NumberPolicy, rnd: () => number = Math.random): GrammaticalNumber[] {
  const sg = hasNumber(n, "sg");
  const pl = hasNumber(n, "pl");
  if (policy === "pl") return pl ? ["pl"] : [];
  if (!sg) return pl ? ["pl"] : [];
  if (policy === "sg" || !pl || !pluralNatural(n)) return ["sg"];
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
