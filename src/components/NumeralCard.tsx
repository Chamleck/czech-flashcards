import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import {
  CardinalEntry,
  Gender,
  GENDER_ORDER,
  GENDER_SHORT,
  CzechCase,
  CASE_LABELS,
  NUMERAL_CASE_ORDER,
} from "../types";
import { theme } from "../utils/theme";
import { GenderIcon } from "./GenderIcon";
import { SegmentTabs } from "./SegmentTabs";
import { Speakable } from "./Speakable";

interface Props {
  entry: CardinalEntry;
  revealed: boolean;
  onReveal: () => void;
}

const KIND_LABEL: Record<CardinalEntry["kind"], string> = {
  gendered: "відмінюється за родом (як ten) · лише однина",
  twoForm: "особлива форма за родом (двоїна: dvěma, oběma)",
  invariantDecl: "відмінюється як kost (із винятками)",
  oblique: "дві форми: пряма (Н/З) і спільна на -i (решта)",
};

// Один рядок відмінка: назва відмінка + питання (голова), одна або дві форми.
function CaseRow({
  c,
  speakId,
  left,
  right,
  rightLabel,
  leftLabel,
}: {
  c: CzechCase;
  speakId: string;
  left: string;
  right?: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const lbl = CASE_LABELS[c];
  const two = right !== undefined;
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <View style={two ? styles.col : styles.colFull}>
          <Text>
            <Text style={styles.caseNum}>{lbl.number}</Text>
            <Text style={styles.caseName}> {lbl.uk}</Text>
            <Text style={styles.caseCz}> ({lbl.cz})</Text>
          </Text>
        </View>
        {two && (
          <View style={styles.col}>
            <Text style={styles.caseQ}>{lbl.question}</Text>
          </View>
        )}
      </View>
      <View style={styles.formsRow}>
        <View style={two ? styles.col : styles.colFull}>
          {leftLabel && <Text style={styles.formLabel}>{leftLabel}</Text>}
          <Speakable id={`${speakId}:${c}:a`} text={left} style={styles.formText} />
        </View>
        {two && (
          <View style={styles.col}>
            {rightLabel && <Text style={styles.formLabel}>{rightLabel}</Text>}
            <Speakable id={`${speakId}:${c}:b`} text={right!} style={styles.formText} />
          </View>
        )}
      </View>
    </View>
  );
}

export function NumeralCard({ entry, revealed, onReveal }: Props) {
  const [gender, setGender] = useState<Gender>("masc_anim");
  const accent = theme.colors.honey;

  useEffect(() => {
    setGender("masc_anim");
  }, [entry.id]);

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
            <Speakable
              id={`${entry.id}:headline`}
              text={entry.cz}
              style={[styles.answerWord, { color: accent }]}
            />
            <Text style={styles.patternText}>{KIND_LABEL[entry.kind]}</Text>
          </View>

          {entry.kind === "gendered" && (
            <>
              <SegmentTabs
                options={GENDER_ORDER}
                active={gender}
                onSelect={setGender}
                colorFor={(g) => theme.genderColor[g]}
                labelFor={(g) => GENDER_SHORT[g]}
                iconFor={(g, on) => <GenderIcon gender={g} size={14} activeDark={on} />}
              />
              <View style={styles.table}>
                {NUMERAL_CASE_ORDER.map((c) => (
                  <CaseRow
                    key={c}
                    c={c}
                    speakId={`${entry.id}:${gender}`}
                    left={entry.declension[gender][c].sg}
                  />
                ))}
              </View>
            </>
          )}

          {entry.kind === "twoForm" && (
            <View style={styles.table}>
              {NUMERAL_CASE_ORDER.map((c) => (
                <CaseRow
                  key={c}
                  c={c}
                  speakId={entry.id}
                  left={entry.forms[c].masc}
                  right={entry.forms[c].femNeut}
                  leftLabel="чол."
                  rightLabel="жін. / сер."
                />
              ))}
            </View>
          )}

          {entry.kind === "invariantDecl" && (
            <View style={styles.table}>
              {NUMERAL_CASE_ORDER.map((c) => (
                <CaseRow key={c} c={c} speakId={entry.id} left={entry.forms[c]} />
              ))}
            </View>
          )}

          {entry.kind === "oblique" && (
            <View style={styles.obliqueBox}>
              <View style={styles.obliqueRow}>
                <Text style={styles.obliqueLabel}>Називний / Знахідний</Text>
                <Speakable id={`${entry.id}:direct`} text={entry.direct} style={styles.obliqueForm} />
              </View>
              <View style={[styles.obliqueRow, styles.obliqueDivider]}>
                <Text style={styles.obliqueLabel}>Решта відмінків (Р/Д/М/О)</Text>
                <Speakable id={`${entry.id}:oblique`} text={entry.oblique} style={styles.obliqueForm} />
              </View>
              <Text style={styles.obliqueNote}>
                Приклад: bez {entry.oblique} (Р), se {entry.oblique} (О).
              </Text>
            </View>
          )}

          {/* Приклад(и) речення */}
          {(entry.kind === "gendered" || entry.kind === "twoForm") && (
            <View style={[styles.example, { borderLeftColor: theme.genderColor[gender] }]}>
              {(() => {
                const ex = entry.examples[gender];
                return (
                  <>
                    <View style={styles.exampleRow}>
                      <Text style={styles.exampleCz}>💬 </Text>
                      <Speakable
                        id={`${entry.id}:${gender}:example`}
                        text={ex.cz}
                        style={styles.exampleCz}
                      />
                    </View>
                    <Text style={styles.exampleUk}>{ex.uk}</Text>
                  </>
                );
              })()}
            </View>
          )}
          {(entry.kind === "invariantDecl" || entry.kind === "oblique") && (
            <View style={styles.example}>
              <View style={styles.exampleRow}>
                <Text style={styles.exampleCz}>💬 </Text>
                <Speakable id={`${entry.id}:example`} text={entry.exampleCz} style={styles.exampleCz} />
              </View>
              <Text style={styles.exampleUk}>{entry.exampleUk}</Text>
            </View>
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
  answerHead: { borderLeftWidth: 4, paddingLeft: theme.space(3), marginBottom: theme.space(4) },
  answerLabel: { color: theme.colors.textDim, fontSize: 13 },
  answerWord: { fontSize: 28, fontWeight: "800", marginVertical: 2 },
  patternText: { color: theme.colors.textDim, fontSize: 13, fontStyle: "italic" },
  table: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
    marginTop: theme.space(3),
  },
  block: { paddingVertical: theme.space(3), paddingHorizontal: theme.space(3.5) },
  head: { flexDirection: "row", alignItems: "flex-start", marginBottom: theme.space(2) },
  col: { width: "50%", paddingRight: theme.space(2) },
  colFull: { width: "100%", paddingRight: 0 },
  caseNum: { color: theme.colors.honey, fontWeight: "800", fontSize: 14 },
  caseName: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  caseCz: { color: theme.genderColor.masc_inan, fontSize: 12, fontWeight: "600", fontStyle: "italic" },
  caseQ: { color: theme.colors.textFaint, fontSize: 12 },
  formsRow: { flexDirection: "row" },
  formLabel: {
    color: theme.colors.textFaint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  formText: { color: theme.colors.text, fontSize: 17, fontWeight: "600" },
  // oblique (pět+): дві форми великим планом
  obliqueBox: {
    marginTop: theme.space(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgElevated,
    padding: theme.space(4),
  },
  obliqueRow: { paddingVertical: theme.space(2) },
  obliqueDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", marginTop: theme.space(2), paddingTop: theme.space(3) },
  obliqueLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  obliqueForm: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  obliqueNote: { color: theme.colors.textDim, fontSize: 13, marginTop: theme.space(3), fontStyle: "italic" },
  example: {
    marginTop: theme.space(4),
    backgroundColor: theme.colors.bgElevated,
    borderLeftWidth: 3,
    borderColor: theme.colors.honey,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
