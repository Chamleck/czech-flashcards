import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { NounEntry } from "../types";
import { theme, GENDER_LABEL } from "../utils/theme";
import { PosEmoji } from "./PosEmoji";
import { SenseExamples } from "./ExampleRow";
import { DeclensionTable } from "./DeclensionTable";
import { Speakable } from "./Speakable";

// Приклади під таблицею: у однозначного слова — один (якщо є), у багатозначного — по одному на значення під його
// підписом (NounSense, types/index.ts).
function examplesOf(n: NounEntry): { label?: string; cz: string; uk: string }[] {
  if (n.senses) return n.senses.map((s) => ({ label: s.label, ...s.example }));
  return n.exampleSentenceCz ? [{ cz: n.exampleSentenceCz, uk: n.exampleSentenceUk ?? "" }] : [];
}

interface Props {
  entry: NounEntry;
  revealed: boolean;
  onReveal: () => void;
}

export function FlashCard({ entry, revealed, onReveal }: Props) {
  const gColor = theme.genderColor[entry.gender];

  return (
    <View style={styles.card}>
      {/* Питання: українське слово */}
      <View>
        <View style={styles.promptLabelRow}>
          <Text style={styles.promptLabel}>українською</Text>
          <PosEmoji name="flagUkraine" size={13} />
        </View>
        <Text style={styles.promptWord}>{entry.uk}</Text>
      </View>

      {!revealed ? (
        <Pressable style={styles.revealBtn} onPress={onReveal}>
          <View style={styles.revealBtnRow}>
            <Text style={styles.revealBtnText}>Показати відповідь</Text>
            <PosEmoji name="eyes" size={16} />
          </View>
        </Pressable>
      ) : (
        <ScrollView
          style={styles.answerScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <>
            <View style={[styles.answerHead, { borderColor: gColor }]}>
              <View style={styles.answerLabelRow}>
              <Text style={styles.answerLabel}>чеською</Text>
              <PosEmoji name="flagCzechia" size={13} />
            </View>
              <Speakable
                id={`${entry.id}:headline`}
                text={entry.cz}
                style={[styles.answerWord, { color: gColor }]}
              />
              <Text style={[styles.genderTag, { color: gColor }]}>
                {GENDER_LABEL[entry.gender]}
              </Text>
            </View>

            <DeclensionTable table={entry.declension} speakId={entry.id} />

            <SenseExamples id={entry.id} items={examplesOf(entry)} />
          </>
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
  promptLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  promptWord: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  revealBtn: {
    marginTop: theme.space(8),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  revealBtnText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  revealBtnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  answerScroll: { marginTop: theme.space(4) },
  answerHead: {
    borderLeftWidth: 4,
    paddingLeft: theme.space(3),
    marginBottom: theme.space(4),
  },
  answerLabel: { color: theme.colors.textDim, fontSize: 13 },
  answerLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  answerWord: { fontSize: 28, fontWeight: "800", marginVertical: 2 },
  genderTag: { fontSize: 13, fontWeight: "600" },
});
