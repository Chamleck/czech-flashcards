import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { VerbEntry, VERB_ASPECT_LABEL } from "../types";
import { theme } from "../utils/theme";
import { PosEmoji } from "./PosEmoji";
import Lightbulb from "lucide-react-native/icons/lightbulb";
import { VERB_CLASS_BY_KEY } from "../data/verbCategories";
import { VerbConjugation } from "./VerbConjugation";
import { Speakable } from "./Speakable";

interface Props {
  entry: VerbEntry;
  revealed: boolean;
  onReveal: () => void;
}

export function VerbCard({ entry, revealed, onReveal }: Props) {
  const classMeta = VERB_CLASS_BY_KEY[entry.verbClass];
  const accent = classMeta.color;
  const infinitive = entry.reflexive ? `${entry.cz} ${entry.reflexive}` : entry.cz;

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
            <View style={[styles.answerHead, { borderColor: accent }]}>
              <View style={styles.answerLabelRow}>
              <Text style={styles.answerLabel}>чеською</Text>
              <PosEmoji name="flagCzechia" size={13} />
            </View>
              <Speakable
                id={`${entry.id}:headline`}
                text={infinitive}
                style={[styles.answerWord, { color: accent }]}
              />
              <View style={styles.tags}>
                <Text style={[styles.tag, { color: accent }]}>{classMeta.title}</Text>
                <Text style={styles.tagDim}>· {VERB_ASPECT_LABEL[entry.aspect]}</Text>
              </View>
            </View>

            <VerbConjugation entry={entry} />

            {entry.aspectPairNote && (
              <View style={styles.pairNote}>
                <View style={styles.pairNoteLabelRow}>
                  <Lightbulb size={13} color={theme.colors.honey} strokeWidth={2.5} />
                  <Text style={styles.pairNoteLabelText}>Порада</Text>
                </View>
                <Text style={styles.pairNoteText}>{entry.aspectPairNote}</Text>
              </View>
            )}
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
  tags: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  tag: { fontSize: 13, fontWeight: "700" },
  tagDim: { color: theme.colors.textDim, fontSize: 13, marginLeft: 4 },
  pairNote: {
    marginTop: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
  },
  pairNoteLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: theme.space(1) },
  pairNoteLabelText: { color: theme.colors.honey, fontSize: 12, fontWeight: "600" },
  pairNoteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
});
