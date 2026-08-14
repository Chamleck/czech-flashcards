import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { VerbEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";
import {
  presentForm,
  futureForm,
  pastForm,
  imperativeForm,
  IMPERATIVE_ORDER,
  IMPERATIVE_LABELS,
} from "../utils/verbForms";

type Mode = "present" | "past" | "future" | "imperative";

// Таблиця з довільними підписами рядків (особа/підмет → форма).
// speakIdBase: якщо переданий, кожна форма озвучувана з id `${speakIdBase}:{i}`.
function FormTable({
  labels,
  forms,
  accent,
  speakIdBase,
}: {
  labels: { cz: string; uk: string }[];
  forms: { cz: string }[];
  accent: string;
  speakIdBase?: string;
}) {
  return (
    <View style={styles.table}>
      {labels.map((lbl, i) => (
        <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.personCell}>
            <Text style={styles.personCz}>{lbl.cz}</Text>
            <Text style={styles.personUk}>{lbl.uk}</Text>
          </View>
          {speakIdBase && forms[i].cz ? (
            <Speakable
              id={`${speakIdBase}:${i}`}
              text={forms[i].cz}
              style={[styles.formText, { color: accent }]}
            />
          ) : (
            <Text style={[styles.formText, { color: accent }]}>{forms[i].cz}</Text>
          )}
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

// Рядки для наказового способу (3 форми: ty/vy/my).
function imperativeRows(v: VerbEntry) {
  return IMPERATIVE_ORDER.map((p) => ({ cz: imperativeForm(v, p) ?? "" }));
}

const MODE_META: Record<Mode, { label: string; color: string }> = {
  present: { label: "Теперішній", color: theme.colors.mint },
  past: { label: "Минулий", color: theme.colors.honey },
  future: { label: "Майбутній", color: theme.colors.lilac },
  imperative: { label: "Наказовий", color: theme.colors.coral },
};

// Стандартні підписи 6 осіб (для теп./мин./майб.).
const PERSON_ROW_LABELS = PERSON_ORDER.map((p) => PERSON_LABELS[p]);
// Підписи 3 осіб наказового способу.
const IMPERATIVE_ROW_LABELS = IMPERATIVE_ORDER.map((p) => IMPERATIVE_LABELS[p]);

export function VerbConjugation({ entry }: { entry: VerbEntry }) {
  const isPerfective = entry.aspect === "perfective";
  const hasImperative = !!entry.imperative;

  // Доступні таби: доконаний вид не має теперішнього; наказовий — лише якщо є.
  const modes: Mode[] = [
    ...(isPerfective ? (["past", "future"] as Mode[]) : (["present", "past", "future"] as Mode[])),
    ...(hasImperative ? (["imperative"] as Mode[]) : []),
  ];
  // Стартовий таб: у доконаного — "past", інакше "present".
  const [mode, setMode] = useState<Mode>(isPerfective ? "past" : "present");

  const pp = entry.pastParticiple;
  const meta = MODE_META[mode];

  const rows =
    mode === "present"
      ? presentRows(entry)
      : mode === "past"
      ? pastRows(entry)
      : mode === "future"
      ? futureRows(entry)
      : imperativeRows(entry);

  const rowLabels = mode === "imperative" ? IMPERATIVE_ROW_LABELS : PERSON_ROW_LABELS;

  // Приклад для поточного режиму.
  const example =
    mode === "present"
      ? entry.examples.present
      : mode === "past"
      ? entry.examples.past
      : mode === "future"
      ? entry.examples.future
      : entry.examples.imperative;

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

      {/* Перемикач режимів (flexWrap — переносить на 2 ряди, коли табів 4) */}
      <View style={styles.segment}>
        {modes.map((t) => {
          const active = t === mode;
          const m = MODE_META[t];
          return (
            <Pressable
              key={t}
              style={[styles.segBtn, active && { backgroundColor: m.color }]}
              onPress={() => setMode(t)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Банер наказового способу — лише під табом "Наказовий" */}
      {mode === "imperative" && (
        <View style={styles.imperativeNote}>
          <Text style={styles.imperativeNoteText}>
            ℹ️ Наказовий спосіб має лише 3 форми: ty (ти), vy (ви) і my (закличне «зробімо»).
            Для «він/вона» використовують конструкцію «ať to udělá» (нехай зробить).
          </Text>
        </View>
      )}

      {/* Таблиця форм поточного режиму */}
      <View style={styles.section}>
        <FormTable
          labels={rowLabels}
          forms={rows}
          accent={theme.colors.text}
          speakIdBase={`${entry.id}:${mode}`}
        />

        {/* Форми дієприкметника за родом — лише під табом "Минулий" */}
        {mode === "past" && (
          <View style={styles.participleBox}>
            <Text style={styles.participleLabel}>Дієприкметник за родом:</Text>
            <Text style={styles.participleForms}>
              <Speakable id={`${entry.id}:pp:m`} text={pp.m} style={styles.pMasc} /> (чол.) ·{" "}
              <Speakable id={`${entry.id}:pp:f`} text={pp.f} style={styles.pFem} /> (жін.) ·{" "}
              <Speakable id={`${entry.id}:pp:n`} text={pp.n} style={styles.pNeut} /> (сер.)
            </Text>
            <Text style={styles.participleForms}>
              мн.:{" "}
              <Speakable id={`${entry.id}:pp:manim_pl`} text={pp.manim_pl} style={styles.pMasc} />{" "}
              (чол. істот.) ·{" "}
              <Speakable id={`${entry.id}:pp:other_pl`} text={pp.other_pl} style={styles.pFem} />{" "}
              (решта)
            </Text>
          </View>
        )}
      </View>

      {/* Приклад речення для поточного режиму */}
      {example && (
        <View style={[styles.example, { borderLeftColor: meta.color }]}>
          <Text style={styles.exampleCz}>
            💬 <Speakable id={`${entry.id}:${mode}:example`} text={example.cz} style={styles.exampleCz} />
          </Text>
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
    flexWrap: "wrap",
    gap: 3,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.space(3),
  },
  segBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 90,
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  segText: { color: theme.colors.textDim, fontSize: 13, fontWeight: "700" },
  segTextActive: { color: "#1a1020" },
  imperativeNote: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
    marginBottom: theme.space(3),
  },
  imperativeNoteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
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
