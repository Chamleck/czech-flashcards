import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { VerbEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { BYT_FUTURE, PAST_AUX } from "../data/auxVerbs";

type Tense = "present" | "past" | "future";

// Таблиця однієї часової форми: особа → форма дієслова.
function TenseTable({ forms, accent }: { forms: { cz: string }[]; accent: string }) {
  return (
    <View style={styles.table}>
      {PERSON_ORDER.map((p, i) => (
        <View key={p} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.personCell}>
            <Text style={styles.personCz}>{PERSON_LABELS[p].cz}</Text>
            <Text style={styles.personUk}>{PERSON_LABELS[p].uk}</Text>
          </View>
          <Text style={[styles.formText, { color: accent }]}>{forms[i].cz}</Text>
        </View>
      ))}
    </View>
  );
}

// Теперішній час: se/si одразу після дієслова ("učím se").
function presentRows(v: VerbEntry) {
  if (!v.present) return [];
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  return PERSON_ORDER.map((p) => ({ cz: `${v.present![p]}${refl}` }));
}

// Майбутній час:
//  - власні форми (доконані, jít→půjdu): se/si одразу після дієслова ("vrátím se");
//  - складене недоконаних: "budu se učit" (se після budu, не після інфінітива).
function futureRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => {
    if (v.future) {
      const refl = v.reflexive ? ` ${v.reflexive}` : "";
      return { cz: `${v.future[p]}${refl}` };
    }
    const refl = v.reflexive ? `${v.reflexive} ` : "";
    return { cz: `${BYT_FUTURE[p]} ${refl}${v.cz}` };
  });
}

// Минулий час: [дієприкметник] [допоміжне] se ("učil jsem se").
// my/vy/oni — форма множини дієприкметника.
function pastRows(v: VerbEntry) {
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  const pp = v.pastParticiple;
  return PERSON_ORDER.map((p) => {
    const aux = PAST_AUX[p];
    const isPlural = p === "my" || p === "vy" || p === "oni";
    const participle = isPlural ? pp.manim_pl : pp.m;
    const cz = aux ? `${participle} ${aux}${refl}` : `${participle}${refl}`;
    return { cz };
  });
}

const TENSE_META: Record<Tense, { label: string; color: string }> = {
  present: { label: "Теперішній", color: theme.colors.mint },
  past: { label: "Минулий", color: theme.colors.honey },
  future: { label: "Майбутній", color: theme.colors.lilac },
};

export function VerbConjugation({ entry }: { entry: VerbEntry }) {
  const isPerfective = entry.aspect === "perfective";

  // Доступні таби: доконаний вид не має теперішнього.
  const tabs: Tense[] = isPerfective ? ["past", "future"] : ["present", "past", "future"];
  // Стартовий таб: у доконаного — "past", інакше "present".
  const [tense, setTense] = useState<Tense>(isPerfective ? "past" : "present");

  const pp = entry.pastParticiple;
  const meta = TENSE_META[tense];

  const rows =
    tense === "present" ? presentRows(entry) : tense === "past" ? pastRows(entry) : futureRows(entry);

  // Приклад для поточного часу.
  const example =
    tense === "present" ? entry.examples.present : tense === "past" ? entry.examples.past : entry.examples.future;

  return (
    <View>
      {/* Банер для доконаних — видно завжди, незалежно від табу */}
      {isPerfective && (
        <View style={styles.perfNote}>
          <Text style={styles.perfNoteText}>
            ℹ️ Доконаний вид не має теперішнього часу. Його «теперішня» дієвідміна за
            значенням є майбутньою.
          </Text>
        </View>
      )}

      {/* Перемикач часів */}
      <View style={styles.segment}>
        {tabs.map((t) => {
          const active = t === tense;
          const m = TENSE_META[t];
          return (
            <Pressable
              key={t}
              style={[styles.segBtn, active && { backgroundColor: m.color }]}
              onPress={() => setTense(t)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Таблиця дієвідміни поточного часу */}
      <View style={styles.section}>
        <TenseTable forms={rows} accent={theme.colors.text} />

        {/* Форми дієприкметника за родом — лише під табом "Минулий" */}
        {tense === "past" && (
          <View style={styles.participleBox}>
            <Text style={styles.participleLabel}>Дієприкметник за родом:</Text>
            <Text style={styles.participleForms}>
              <Text style={styles.pMasc}>{pp.m}</Text> (чол.) ·{" "}
              <Text style={styles.pFem}>{pp.f}</Text> (жін.) ·{" "}
              <Text style={styles.pNeut}>{pp.n}</Text> (сер.)
            </Text>
            <Text style={styles.participleForms}>
              мн.: <Text style={styles.pMasc}>{pp.manim_pl}</Text> (чол. істот.) ·{" "}
              <Text style={styles.pFem}>{pp.other_pl}</Text> (решта)
            </Text>
          </View>
        )}
      </View>

      {/* Приклад речення для поточного часу */}
      {example && (
        <View style={[styles.example, { borderLeftColor: meta.color }]}>
          <Text style={styles.exampleCz}>💬 {example.cz}</Text>
          <Text style={styles.exampleUk}>{example.uk}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.space(3) },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.space(3),
  },
  segBtn: {
    flex: 1,
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  segText: { color: theme.colors.textDim, fontSize: 13, fontWeight: "700" },
  segTextActive: { color: "#1a1020" },
  table: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowAlt: { backgroundColor: "rgba(255,255,255,0.03)" },
  personCell: { flex: 1.3, paddingVertical: theme.space(2), paddingHorizontal: theme.space(2.5) },
  personCz: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  personUk: { color: theme.colors.textFaint, fontSize: 11 },
  formText: {
    flex: 1.7,
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2.5),
    fontSize: 15,
    fontWeight: "600",
  },
  perfNote: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
    marginBottom: theme.space(3),
  },
  perfNoteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
  participleBox: { marginTop: theme.space(2), paddingHorizontal: theme.space(1) },
  participleLabel: { color: theme.colors.textDim, fontSize: 12, fontWeight: "700", marginBottom: 2 },
  participleForms: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
  pMasc: { color: theme.colors.mint, fontWeight: "700" },
  pFem: { color: "#ff8fb1", fontWeight: "700" },
  pNeut: { color: theme.colors.honey, fontWeight: "700" },
  example: {
    marginTop: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderLeftWidth: 3,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
