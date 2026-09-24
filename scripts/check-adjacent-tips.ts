import { GRAMMAR_TOPICS } from "../src/data/grammar";

let found = 0;
for (const topic of GRAMMAR_TOPICS) {
  const blocks = topic.blocks;
  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i].type;
    const b = blocks[i + 1].type;
    const tipLike = (t: string) => t === "tip" || t === "rich-tip" || t === "tip-group";
    if (tipLike(a) && tipLike(b)) {
      found++;
      console.log(`ADJACENT in topic "${topic.id}" (title: ${topic.title}) at blocks[${i}]=${a} -> blocks[${i + 1}]=${b}`);
    }
  }
}
console.log(`\nTotal adjacent tip-like pairs found: ${found}`);
