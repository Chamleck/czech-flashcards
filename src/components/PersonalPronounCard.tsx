import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import {
  PersonalPronounEntry,
  PersonalDeclension,
  DeclensionTable as TableType,
  Gender,
  GENDER_ORDER,
  GENDER_SHORT,
  CASE_ORDER,
} from "../types";
import { theme } from "../utils/theme";
import { DeclensionTable } from "./DeclensionTable";
import { GenderIcon } from "./GenderIcon";
import { SegmentTabs } from "./SegmentTabs";
import { Speakable } from "./Speakable";

interface Props {
  entry: PersonalPronounEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Пара форм {a,b} → сітка таблиці {sg,pl}: ліва колонка = a, права = b.
function toTable(decl: PersonalDeclension): TableType {
  const out = {} as TableType;
  for (const c of CASE_ORDER) out[c] = { sg: decl[c].a, pl: decl[c].b };
  return out;
}

export function PersonalPronounCard({ entry, revealed, onReveal }: Props) {
  const [gender, setGender] = useState<Gender>("masc_anim");
  const accent = theme.colors.lilac;

  useEffect(() => {
    setGender("masc_anim");
  }, [entry.id]);

  // my / vy — одна форма на відмінок (колонка b скрізь "—").
  const singleColumn = entry.columns.b === "—";
  const columnLabels = { sg: entry.columns.a, pl: entry.columns.b };

  const decl: PersonalDeclension = entry.gendered ? entry.declension[gender] : entry.declension;
  const example = entry.gendered ? entry.examples[gender] : { cz: entry.exampleCz, uk: entry.exampleUk };
  const exampleId = entry.gendered ? `${entry.id}:${gender}:example` : `${entry.id}:example`;
  const tableSpeakId = entry.gendered ? `${entry.id}:${gender}` : entry.id;

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
                id={`${entry.id}:headline`}
                text={entry.cz}
                style={[styles.answerWord, { color: accent }]}
              />
              <Text style={styles.patternText}>особовий займенник · нерегулярне відмінювання</Text>
            </View>

            {/* Таби роду — лише для 3-ї особи (on/ona/ono, oni/ony/ona) */}
            {entry.gendered && (
              <SegmentTabs
                options={GENDER_ORDER}
                active={gender}
                onSelect={setGender}
                colorFor={(g) => theme.genderColor[g]}
                labelFor={(g) => GENDER_SHORT[g]}
                iconFor={(g, on) => <GenderIcon gender={g} size={14} activeDark={on} />}
              />
            )}

            <DeclensionTable
              table={toTable(decl)}
              columnLabels={columnLabels}
              singleColumn={singleColumn}
              speakId={tableSpeakId}
            />

            {example && (
              <View
                style={[
                  styles.example,
                  { borderLeftColor: entry.gendered ? theme.genderColor[gender] : accent },
                ]}
              >
                <Text style={styles.exampleCz}>
                  💬 <Speakable id={exampleId} text={example.cz} style={styles.exampleCz} />
                </Text>
                <Text style={styles.exampleUk}>{example.uk}</Text>
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
  example: {
    marginTop: theme.space(4),
    backgroundColor: theme.colors.bgElevated,
    borderLeftWidth: 3,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
