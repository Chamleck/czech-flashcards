import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { VerbEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { presentForm, futureForm, pastForm } from "../utils/verbForms";

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

// Рядки таблиці для теперішнього часу (6 стандартних осіб).
function presentRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => ({ cz: presentForm(v, p) ?? "" }));
}

// Рядки для майбутнього часу.
function futureRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => ({ cz: futureForm(v, p) }));
}

// Рядки для минулого часу — у таблиці показуємо базово чол. рід для он/они
// (повний розклад за родом — окремим блоком нижче).
function pastRows(v: VerbEntry) {
  const map: Record<string, "ja" | "ty" | "on" | "my" | "vy" | "oni_manim"> = {
    ja: "ja",
    ty: "ty",
    on: "on",
    my: "my",
    vy: "vy",
    oni: "oni_manim",
  };
  return PERSON_ORDER.map((p) => ({ cz: pastForm(v, map[p]) }));
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
