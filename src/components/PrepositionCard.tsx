import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { PrepositionEntry, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";

interface Props {
  entry: PrepositionEntry;
  revealed: boolean;
  onReveal: () => void;
}

export function PrepositionCard({ entry, revealed, onReveal }: Props) {
  const accent = theme.colors.mint;
  const caseLbl = CASE_LABELS[entry.govCase];

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.promptLabel}>українською 🇺🇦</Text>
        <Text style={styles.promptWord}>{entry.uk}</Text>
      </View>

      {!revealed ? (
        <Pressable style={styles.revealBtn} onPress={onReveal}>
          <Text style={styles.revealBtnText}>Показати відповідь 👀</Text>
        </Pressable>
      ) : (
        <ScrollView
          style={styles.answerScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.answerHead, { borderColor: accent }]}>
            <Text style={styles.answerLabel}>чеською 🇨🇿</Text>
            <Speakable id={`${entry.id}:headline`} text={entry.cz} style={[styles.answerWord, { color: accent }]} />
            {entry.vocalized && (
              <Text style={styles.vocalForm}>
                вокалізована форма: <Text style={{ color: accent, fontWeight: "800" }}>{entry.vocalized}</Text>
              </Text>
            )}
          </View>

          {/* Відмінок, яким керує прийменник */}
          <View style={styles.caseBox}>
            <Text style={styles.caseBoxLabel}>керує відмінком</Text>
            <Text style={styles.caseBoxCase}>
              {caseLbl.uk} ({caseLbl.cz})
            </Text>
            <Text style={styles.caseBoxQ}>{caseLbl.question}</Text>
          </View>

          {entry.vocalNote && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>💡 {entry.vocalNote}</Text>
            </View>
          )}

          {/* Приклади */}
          {entry.examples.map((ex, i) => (
            <View key={i} style={[styles.example, { borderLeftColor: accent }]}>
              <View style={styles.exampleRow}>
                <Text style={styles.exampleCz}>💬 </Text>
                <Speakable id={`${entry.id}:ex${i}`} text={ex.cz} style={styles.exampleCz} />
              </View>
              <Text style={styles.exampleUk}>{ex.uk}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
  },
  promptLabel: { color: theme.colors.textDim, fontSize: 13, marginBottom: 4 },
  promptWord: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  revealBtn: {
    marginTop: theme.space(8),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  revealBtnText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  answerScroll: { marginTop: theme.space(4) },
  answerHead: {
    borderLeftWidth: 4,
    paddingLeft: theme.space(3),
    marginBottom: theme.space(4),
  },
  answerLabel: { color: theme.colors.textDim, fontSize: 13 },
  answerWord: { fontSize: 28, fontWeight: "800", marginVertical: 2 },
  vocalForm: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  caseBox: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(3),
  },
  caseBoxLabel: { color: theme.colors.textDim, fontSize: 12 },
  caseBoxCase: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
  caseBoxQ: { color: theme.colors.textFaint, fontSize: 13, marginTop: 2 },
  noteBox: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(3),
  },
  noteText: { color: theme.colors.text, fontSize: 13, lineHeight: 19 },
  example: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
