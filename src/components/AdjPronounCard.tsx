import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import {
  AdjectiveEntry,
  PronounEntry,
  Gender,
  GENDER_ORDER,
  GENDER_SHORT,
} from "../types";
import { theme } from "../utils/theme";
import { DeclensionTable } from "./DeclensionTable";
import { GenderIcon } from "./GenderIcon";
import { SegmentTabs } from "./SegmentTabs";
import { Speakable } from "./Speakable";

export type DeclEntry = AdjectiveEntry | PronounEntry;

type Degree = "positive" | "comparative" | "superlative";
const DEGREE_ORDER: Degree[] = ["positive", "comparative", "superlative"];
const DEGREE_SHORT: Record<Degree, string> = {
  positive: "Звичайний",
  comparative: "Вищий",
  superlative: "Найвищий",
};

interface Props {
  entry: DeclEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Незмінний займенник (jeho/jejich) — немає declension.
function isIndeclinable(e: DeclEntry): boolean {
  return "declinable" in e && e.declinable === false;
}

// Ступені порівняння має лише градуйований прикметник (не займенник, не відносний).
function degreesOf(e: DeclEntry): AdjectiveEntry["degrees"] | undefined {
  return "degrees" in e ? e.degrees : undefined;
}

// Підпис зразка під заголовком картки.
function patternLabel(e: DeclEntry, degree: Degree): string {
  // Ступені порівняння відмінюються за зразком jarní незалежно від базового.
  if (degree !== "positive") return "ступінь порівняння · відмінюється як jarní";
  if ("pattern" in e) {
    const base = e.pattern === "tvrdy" ? "твердий зразок (mladý)" : "м'який зразок (jarní)";
    return e.hasConsonantAlternation ? `${base} · чергування у чол. іст. мн.` : base;
  }
  if ("vzorLabel" in e) return e.vzorLabel;
  return "незмінний";
}

export function AdjPronounCard({ entry, revealed, onReveal }: Props) {
  const [gender, setGender] = useState<Gender>("masc_anim");
  const [degree, setDegree] = useState<Degree>("positive");
  const accent = theme.colors.lilac;

  // Скидаємо обраний рід і ступінь при зміні слова.
  useEffect(() => {
    setGender("masc_anim");
    setDegree("positive");
  }, [entry.id]);

  const indeclinable = isIndeclinable(entry);
  const degrees = degreesOf(entry);

  // Активна парадигма й підпис слова залежно від обраного ступеня.
  const currentDecl =
    degree === "positive" || !degrees ? (entry as any).declension : degrees[degree].declension;
  const currentCz = degree === "positive" || !degrees ? entry.cz : degrees[degree].cz;

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
          <>
            <View style={[styles.answerHead, { borderColor: accent }]}>
              <Text style={styles.answerLabel}>чеською 🇨🇿</Text>
              <Speakable
                id={`${entry.id}:${degree}:headline`}
                text={currentCz}
                style={[styles.answerWord, { color: accent }]}
              />
              <Text style={styles.patternText}>{patternLabel(entry, degree)}</Text>
            </View>

            {indeclinable ? (
              <View style={styles.invariantBox}>
                <Speakable
                  id={`${entry.id}:invariant`}
                  text={(entry as any).invariantForm}
                  style={styles.invariantForm}
                />
                <Text style={styles.invariantNote}>
                  Незмінний займенник — однакова форма в усіх відмінках, родах і числах.
                </Text>
              </View>
            ) : (
              <>
                {/* Вісь ступеня порівняння — лише для градуйованих прикметників */}
                {degrees && (
                  <SegmentTabs
                    options={DEGREE_ORDER}
                    active={degree}
                    onSelect={setDegree}
                    colorFor={() => theme.colors.honey}
                    labelFor={(d) => DEGREE_SHORT[d]}
                    minWidth={90}
                    flexBasis="30%"
                  />
                )}

                {/* Таби роду */}
                <SegmentTabs
                  options={GENDER_ORDER}
                  active={gender}
                  onSelect={setGender}
                  colorFor={(g) => theme.genderColor[g]}
                  labelFor={(g) => GENDER_SHORT[g]}
                  iconFor={(g, on) => <GenderIcon gender={g} size={14} activeDark={on} />}
                />

                <DeclensionTable table={currentDecl[gender]} speakId={`${entry.id}:${degree}:${gender}`} />
              </>
            )}

            {/* Приклад показуємо лише для звичайного ступеня та незмінних.
                Для вищого/найвищого прикладу немає — таблиця вже показує суть. */}
            {indeclinable
              ? (entry as any).exampleSentenceCz && (
                  <View style={styles.example}>
                    <View style={styles.exampleRow}>
                      <Text style={styles.exampleCz}>💬 </Text>
                      <Speakable
                        id={`${entry.id}:example`}
                        text={(entry as any).exampleSentenceCz}
                        style={styles.exampleCz}
                      />
                    </View>
                    <Text style={styles.exampleUk}>{(entry as any).exampleSentenceUk}</Text>
                  </View>
                )
              : degree === "positive" &&
                (() => {
                  const ex = (entry as any).examples[gender];
                  return (
                    <View style={[styles.example, { borderLeftColor: theme.genderColor[gender] }]}>
                      <View style={styles.exampleRow}>
                        <Text style={styles.exampleCz}>💬 </Text>
                        <Speakable
                          id={`${entry.id}:${gender}:example`}
                          text={ex.cz}
                          style={styles.exampleCz}
                        />
                      </View>
                      <Text style={styles.exampleUk}>{ex.uk}</Text>
                    </View>
                  );
                })()}
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
  patternText: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
  invariantBox: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    alignItems: "center",
  },
  invariantForm: { color: theme.colors.lilac, fontSize: 26, fontWeight: "800" },
  invariantNote: {
    color: theme.colors.textDim,
    fontSize: 13,
    textAlign: "center",
    marginTop: theme.space(2),
    lineHeight: 19,
  },
  example: {
    marginTop: theme.space(4),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
