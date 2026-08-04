import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DeclensionTable as TableType, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";

// Кожен відмінок — блок із ДВОМА рядками, що поділяють ту саму сітку колонок
// 48%/48% (formCol/formColPl): заголовок (номер·назва·зразок | контрольне питання)
// і форми (однина | множина). Через спільні стилі колонок обидва рядки завжди
// вирівняні по одній вертикальній лінії — контрольне питання стоїть точно
// над значенням множини, незалежно від довжини назви відмінка перед ним.
// Довгий текст переноситься всередині своєї колонки, не зсуваючи сусідню.
export function DeclensionTable({ table }: { table: TableType }) {
  return (
    <View style={styles.wrap}>
      {CASE_ORDER.map((c, i) => {
        const lbl = CASE_LABELS[c];
        // Займенники не мають вокатива (обидві форми "—") — приглушуємо рядок.
        const empty = table[c].sg === "—" && table[c].pl === "—";
        return (
          <View key={c} style={[styles.block, i > 0 && styles.blockDivider, empty && styles.blockEmpty]}>
            <View style={styles.head}>
              <View style={styles.formCol}>
                <Text>
                  <Text style={styles.caseNum}>{lbl.number}</Text>
                  <Text style={styles.caseName}> {lbl.uk}</Text>
                  <Text style={styles.caseCz}> ({lbl.cz})</Text>
                </Text>
              </View>
              <View style={styles.formColPl}>
                <Text style={styles.caseQ}>{lbl.question}</Text>
              </View>
            </View>
            <View style={styles.formsRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>однина</Text>
                <Text style={[styles.formText, empty && styles.formEmpty]}>{table[c].sg}</Text>
              </View>
              <View style={styles.formColPl}>
                <Text style={styles.formLabel}>множина</Text>
                <Text style={[styles.formText, empty && styles.formEmpty]}>{table[c].pl}</Text>
              </View>
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
  // Перший стовпець (однина) — ФІКСОВАНИЙ відсоток (не flex і не px): довга
  // форма (напр. "studentovi / studentu") переноситься всередині нього й НЕ
  // розпихає сусідній стовпець в один конкретний рядок. Відсоток (а не px)
  // масштабується під ширину екрана — на вузьких пристроях обидва стовпці
  // звужуються пропорційно, замість того щоб перший з'їдав сталу кількість dp
  // за рахунок другого. Стовпець множини завжди стартує з однакової позиції.
  formCol: { width: "48%", paddingRight: theme.space(2) },
  formColPl: { width: "48%", paddingRight: 0 },
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
