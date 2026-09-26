import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { ConditionalConjunctionEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { PosEmoji } from "./PosEmoji";
import { TileEmoji } from "./TileEmoji";
import { Speakable } from "./Speakable";
import { InfoBanner } from "./InfoBanner";
import { PersonFormsTable } from "./PersonFormsTable";

interface Props {
  entry: ConditionalConjunctionEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Картка для aby/kdyby — на відміну від SimpleWordCard (InvariantWordEntry,
// де 4 приклади КОМПЕНСУЮТЬ відсутню парадигму), тут парадигма Є (6 особових
// форм), тому картка ближча за духом до FlashCard/AdjPronounCard: таблиця
// форм + 1 приклад — той самий принцип "повна парадигма → 1 приклад".
// Той самий акцентний колір, що SimpleWordCard — картка належить тому самому
// розділу "Службові слова", кольорової ролі (як рід/клас) тут нема.
const ACCENT = "#d98cbf";

const PERSON_ROW_LABELS = PERSON_ORDER.map((p) => PERSON_LABELS[p]);

export function ConditionalParticleCard({ entry, revealed, onReveal }: Props) {
  const rows = PERSON_ORDER.map((p) => ({ cz: entry.paradigm[p] }));

  return (
    <View style={styles.card}>
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
          <View style={styles.answerHead}>
            <View style={styles.answerLabelRow}>
              <Text style={styles.answerLabel}>чеською</Text>
              <PosEmoji name="flagCzechia" size={13} />
            </View>
            <Speakable id={`${entry.id}:headline`} text={entry.cz} style={styles.answerWord} />
          </View>

          {entry.note && <InfoBanner paragraphs={[entry.note]} />}

          <View style={styles.section}>
            <PersonFormsTable
              labels={PERSON_ROW_LABELS}
              forms={rows}
              accent={ACCENT}
              speakIdBase={`${entry.id}:form`}
            />
          </View>

          {entry.examples.map((ex, i) => (
            <View key={i} style={styles.example}>
              <View style={styles.exampleRow}>
                <TileEmoji name="speechBalloon" size={15} />
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
    borderLeftColor: ACCENT,
    paddingLeft: theme.space(3),
    marginBottom: theme.space(4),
  },
  answerLabel: { color: theme.colors.textDim, fontSize: 13 },
  answerLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  answerWord: { fontSize: 28, fontWeight: "800", marginVertical: 2, color: ACCENT },
  section: { marginBottom: theme.space(3) },
  example: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
