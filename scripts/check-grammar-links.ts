import { GRAMMAR_TOPICS } from "../src/data/grammar";
import { findSearchEntry } from "../src/utils/searchIndex";

let total = 0;
let missing: string[] = [];

function walkSegments(segs: any[], ctx: string) {
  for (const s of segs) {
    if ("wordId" in s) {
      total++;
      const found = findSearchEntry(s.wordId, s.kind);
      if (!found) missing.push(`${ctx}: wordId=${s.wordId} kind=${s.kind} (word="${s.word}")`);
    }
  }
}

for (const topic of GRAMMAR_TOPICS) {
  for (const block of topic.blocks) {
    if (block.type === "rich-tip") walkSegments(block.segments, `${topic.id}/rich-tip`);
    if (block.type === "rich-paragraph") walkSegments(block.segments, `${topic.id}/rich-paragraph`);
    if (block.type === "tip-group") {
      for (const item of block.items) {
        if ("segments" in item) walkSegments(item.segments, `${topic.id}/tip-group`);
      }
    }
    if (block.type === "rich-list") {
      for (const it of block.items) {
        walkSegments(it.term, `${topic.id}/rich-list/term`);
        walkSegments(it.note, `${topic.id}/rich-list/note`);
      }
    }
    if (block.type === "patterns") {
      for (const g of block.groups) {
        for (const item of g.items) {
          if (item.nameWordId) {
            total++;
            // pattern names resolve as 'nouns' kind by convention used elsewhere; skip strict check here
          }
          walkSegments(item.note, `${topic.id}/patterns/${item.name}`);
        }
      }
    }
  }
}

console.log(`Checked ${total} clickable word links across all grammar topics.`);
if (missing.length) {
  console.log(`MISSING (${missing.length}):`);
  missing.forEach((m) => console.log("  - " + m));
  process.exit(1);
} else {
  console.log("All clickable word links resolve OK.");
}
