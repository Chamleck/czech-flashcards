import { VERBS } from "../src/data/verbs";
import { findSearchEntry } from "../src/utils/searchIndex";

// Без прив'язки до початку рядка (^) — деякі примітки мають префікс перед
// шаблоном (напр. "нерегулярне доконане; недоконаний партнер: brát"), тож
// шукаємо фразу будь-де в тексті. Безпечно, бо ціль кліку в реальному коді
// (VerbConjugation.tsx) завжди entry.aspectPairId, ніколи не цей текст.
const RE = /(недоконаний партнер|доконаний партнер): /;
let willBeClickable = 0;
let staysPlainText = 0;
let brokenTargets: string[] = [];

for (const v of VERBS) {
  if (!v.aspectPairNote) continue;
  const matches = RE.test(v.aspectPairNote);
  if (!matches || !v.aspectPairId) {
    staysPlainText++;
    continue;
  }
  willBeClickable++;
  const target = findSearchEntry(v.aspectPairId, "verbs");
  if (!target) brokenTargets.push(`${v.id} -> aspectPairId="${v.aspectPairId}" NOT FOUND via findSearchEntry`);
}

console.log(`Стануть клікабельними: ${willBeClickable}`);
console.log(`Лишаються простим текстом (fallback): ${staysPlainText}`);
console.log(`Розбитих цілей кліку: ${brokenTargets.length}`);
brokenTargets.forEach((b) => console.log("  - " + b));
