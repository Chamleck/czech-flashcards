import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { PrepositionEntry, PrepositionSense, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";
import { SegmentTabs } from "./SegmentTabs";

interface Props {
  entry: PrepositionEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Один приклад-рядок з озвученням. Speakable — СИБЛІНГ у View row (ніколи не
// вкладений у <Text>), згідно з правилом проєкту про незалежну opacity.
function ExampleRow({ id, cz, uk, accent }: { id: string; cz: string; uk: string; accent: string }) {
  return (
    <View style={[styles.example, { borderLeftColor: accent }]}>
      <View style={styles.exampleRow}>
        <Text style={styles.exampleCz}>💬 </Text>
        <Speakable id={id} text={cz} style={styles.exampleCz} />
      </View>
      <Text style={styles.exampleUk}>{uk}</Text>
    </View>
  );
}

// Блок одного "сенсу" дуального прийменника: заголовок + відмінок + приклади.
function SenseBlock({
  idPrefix,
  heading,
  sense,
  accent,
}: {
  idPrefix: string;
  heading: string;
  sense: PrepositionSense;
  accent: string;
}) {
  const lbl = CASE_LABELS[sense.govCase];
  return (
    <View style={styles.senseBlock}>
      <Text style={[styles.senseHeading, { color: accent }]}>{heading}</Text>
      <Text style={styles.senseCase}>
        {lbl.uk} ({lbl.cz}) — {lbl.question}
      </Text>
      {sense.examples.map((ex, i) => (
        <ExampleRow key={i} id={`${idPrefix}:ex${i}`} cz={ex.cz} uk={ex.uk} accent={accent} />
      ))}
    </View>
  );
}

// Вкладки для «za»: просторове значення (рух/спокій) vs обмін/ціна — різні сенси.
type ZaTab = "space" | "exchange";

export function PrepositionCard({ entry, revealed, onReveal }: Props) {
  const accent = theme.colors.mint;
  const isDual = entry.type === "dual" && !!entry.dual;
  const hasExchange = isDual && !!entry.dual?.exchange;
  const [zaTab, setZaTab] = useState<ZaTab>("space");

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

          {entry.vocalNote && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>💡 {entry.vocalNote}</Text>
            </View>
          )}

          {!isDual ? (
            <>
              <View style={styles.caseBox}>
                <Text style={styles.caseBoxLabel}>керує відмінком</Text>
                <Text style={styles.caseBoxCase}>
                  {CASE_LABELS[entry.govCase].uk} ({CASE_LABELS[entry.govCase].cz})
                </Text>
                <Text style={styles.caseBoxQ}>{CASE_LABELS[entry.govCase].question}</Text>
              </View>
              {entry.examples.map((ex, i) => (
                <ExampleRow key={i} id={`${entry.id}:ex${i}`} cz={ex.cz} uk={ex.uk} accent={accent} />
              ))}
            </>
          ) : (
            <>
              <View style={styles.dualHint}>
                <Text style={styles.dualHintText}>
                  Керує ДВОМА відмінками — залежно від того, рух це чи спокій.
                </Text>
              </View>

              {hasExchange && (
                <SegmentTabs<ZaTab>
                  options={["space", "exchange"] as const}
                  active={zaTab}
                  onSelect={setZaTab}
                  colorFor={() => accent}
                  labelFor={(v) => (v === "space" ? "простір" : "обмін / ціна")}
                  iconFor={(v) => <Text style={styles.tabIcon}>{v === "space" ? "📍" : "💰"}</Text>}
                  minWidth={120}
                  flexBasis="46%"
                  style={{ marginBottom: theme.space(3) }}
                />
              )}

              {(!hasExchange || zaTab === "space") && (
                <>
                  <SenseBlock
                    idPrefix={`${entry.id}:motion`}
                    heading="куди? (рух) →"
                    sense={entry.dual!.motion}
                    accent={accent}
                  />
                  <SenseBlock
                    idPrefix={`${entry.id}:location`}
                    heading="де? (спокій) •"
                    sense={entry.dual!.location}
                    accent={theme.colors.lilac}
                  />
                </>
              )}

              {hasExchange && zaTab === "exchange" && (
                <SenseBlock
                  idPrefix={`${entry.id}:exchange`}
                  heading="обмін / ціна"
                  sense={entry.dual!.exchange!}
                  accent={theme.colors.honey}
                />
              )}
            </>
          )}
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
  dualHint: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
    marginBottom: theme.space(3),
  },
  dualHintText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
  senseBlock: {
    marginBottom: theme.space(4),
  },
  senseHeading: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  senseCase: { color: theme.colors.textFaint, fontSize: 13, marginBottom: theme.space(2) },
  tabIcon: { fontSize: 15, marginRight: 4 },
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
