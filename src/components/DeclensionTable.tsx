import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DeclensionTable as TableType, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";

// Кожен відмінок — блок із ДВОМА рядками, що поділяють ту саму сітку колонок
// 58%/42% (formCol/formColPl): заголовок (номер·назва·зразок | контрольне питання)
// і форми (ліва | права колонка). Через спільні стилі колонок обидва рядки завжди
// вирівняні по одній вертикальній лінії — контрольне питання стоїть точно
// над значенням правої колонки, незалежно від довжини назви відмінка перед ним.
// Довгий текст переноситься всередині своєї колонки, не зсуваючи сусідню.
//
// За замовчуванням колонки — «однина» / «множина» (іменники, прикметники,
// присвійні/вказівні займенники). Особові займенники передають власні
// columnLabels (короткий/довгий або без прийм./після прийм.), а my/vy —
// singleColumn (одна форма на відмінок, права колонка не потрібна).
interface Props {
  table: TableType;
  columnLabels?: { sg: string; pl: string };
  singleColumn?: boolean;
}

export function DeclensionTable({ table, columnLabels, singleColumn = false }: Props) {
  const leftLabel = columnLabels?.sg ?? "однина";
  const rightLabel = columnLabels?.pl ?? "множина";

  return (
    <View style={styles.wrap}>
      {CASE_ORDER.map((c, i) => {
        const lbl = CASE_LABELS[c];
        const sg = table[c].sg;
        const pl = table[c].pl;
        // Рядок повністю порожній (обидві форми "—") — приглушуємо весь блок
        // (напр. вокатив у займенників). Окрема клітинка "—" приглушується сама.
        const rowEmpty = sg === "—" && (singleColumn || pl === "—");
        return (
          <View key={c} style={[styles.block, i > 0 && styles.blockDivider, rowEmpty && styles.blockEmpty]}>
            <View style={styles.head}>
              <View style={singleColumn ? styles.formColFull : styles.formCol}>
                <Text>
                  <Text style={styles.caseNum}>{lbl.number}</Text>
                  <Text style={styles.caseName}> {lbl.uk}</Text>
                  <Text style={styles.caseCz}> ({lbl.cz})</Text>
                </Text>
              </View>
              {!singleColumn && (
                <View style={styles.formColPl}>
                  <Text style={styles.caseQ}>{lbl.question}</Text>
                </View>
              )}
            </View>
            <View style={styles.formsRow}>
              <View style={singleColumn ? styles.formColFull : styles.formCol}>
                <Text style={styles.formLabel}>{leftLabel}</Text>
                <Text style={[styles.formText, sg === "—" && styles.formEmpty]}>{sg}</Text>
              </View>
              {!singleColumn && (
                <View style={styles.formColPl}>
                  <Text style={styles.formLabel}>{rightLabel}</Text>
                  <Text style={[styles.formText, pl === "—" && styles.formEmpty]}>{pl}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  block: {
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(3.5),
  },
  blockDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  blockEmpty: { opacity: 0.4 },
  formEmpty: { color: theme.colors.textFaint },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.space(2),
  },
  caseNum: { color: theme.colors.honey, fontWeight: "800", fontSize: 14 },
  caseName: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  caseCz: { color: theme.genderColor.masc_inan, fontSize: 12, fontWeight: "600", fontStyle: "italic" },
  caseQ: { color: theme.colors.textFaint, fontSize: 12 },
  formsRow: { flexDirection: "row" },
  // Асиметричне співвідношення 58/42 (див. коментар про фіксований %). Ліва
  // колонка ширша, бо несе довшу назву відмінка; права — коротке питання/форму.
  // Відсоток (не px) масштабується під ширину екрана; довгий текст переноситься
  // всередині колонки, не зсуваючи сусідню.
  formCol: { width: "58%", paddingRight: theme.space(2) },
  formColPl: { width: "42%", paddingRight: 0 },
  // Одноколоночний режим (my / vy — одна форма на відмінок).
  formColFull: { width: "100%", paddingRight: 0 },
  formLabel: {
    color: theme.colors.textFaint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  formText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
});
