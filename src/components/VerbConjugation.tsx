import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { VerbEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { BYT_FUTURE, PAST_AUX } from "../data/auxVerbs";

// Таблиця однієї часової форми: особа → форма дієслова.
function TenseTable({
  forms,
  accent,
}: {
  forms: { cz: string; hint?: string }[];
  accent: string;
}) {
  return (
    <View style={styles.table}>
      {PERSON_ORDER.map((p, i) => (
        <View key={p} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.personCell}>
            <Text style={styles.personCz}>{PERSON_LABELS[p].cz}</Text>
            <Text style={styles.personUk}>{PERSON_LABELS[p].uk}</Text>
          </View>
          <Text style={[styles.formText, { color: accent }]}>{forms[i].cz}</Text>
        </View>
      ))}
    </View>
  );
}

// Побудова рядків для теперішнього часу.
// se/si йде одразу після дієслова — дієслово тут єдиний наголошений елемент,
// тож клітика природно потрапляє на другу позицію: "učím se".
function presentRows(v: VerbEntry) {
  if (!v.present) return [];
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  return PERSON_ORDER.map((p) => ({ cz: `${v.present![p]}${refl}` }));
}

// Побудова рядків для майбутнього часу.
//  - якщо є власні форми future (доконані, jít→půjdu тощо) — це одне фінітне
//    дієслово, se/si додається одразу після нього: "vrátím se";
//  - інакше складене недоконаних: budu/budeš… + інфінітив. Тут допоміжне
//    "budu" — наголошений елемент, тож se/si стає одразу після НЬОГО,
//    а не після інфінітива: "budu se učit", НЕ "budu učit se".
function futureRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => {
    if (v.future) {
      const refl = v.reflexive ? ` ${v.reflexive}` : "";
      return { cz: `${v.future[p]}${refl}` };
    }
    const refl = v.reflexive ? `${v.reflexive} ` : "";
    return { cz: `${BYT_FUTURE[p]} ${refl}${v.cz}` };
  });
}

// Побудова рядків для минулого часу: допоміжне (jsem/jsi/…) + l-дієприкметник.
//  - ja/ty/on: однина (чоловічий рід — базовий варіант; усі роди окремим блоком);
//  - my/vy/oni: множина (чол. істот. — базовий варіант);
//  - порядок клітики: [дієприкметник] [допоміжне] se — "učil jsem se",
//    НЕ "učil se jsem". Коли допоміжного немає (3-тя особа), se йде одразу
//    після дієприкметника, який сам стає наголошеним елементом: "učil se".
function pastRows(v: VerbEntry) {
  const refl = v.reflexive ? ` ${v.reflexive}` : "";
  const pp = v.pastParticiple;
  return PERSON_ORDER.map((p) => {
    const aux = PAST_AUX[p];
    const isPlural = p === "my" || p === "vy" || p === "oni";
    const participle = isPlural ? pp.manim_pl : pp.m;
    const cz = aux ? `${participle} ${aux}${refl}` : `${participle}${refl}`;
    return { cz };
  });
}

export function VerbConjugation({ entry }: { entry: VerbEntry }) {
  const isPerfective = entry.aspect === "perfective";
  const pp = entry.pastParticiple;

  return (
    <View>
      {/* Теперішній час — тільки для недоконаного виду */}
      {entry.present && (
        <View style={styles.section}>
          <Text style={[styles.tenseTitle, { color: theme.colors.mint }]}>
            Теперішній час
          </Text>
          <TenseTable forms={presentRows(entry)} accent={theme.colors.text} />
        </View>
      )}

      {isPerfective && (
        <View style={styles.perfNote}>
          <Text style={styles.perfNoteText}>
            ℹ️ Доконаний вид не має теперішнього часу. Його «теперішня» дієвідміна за
            значенням є майбутньою.
          </Text>
        </View>
      )}

      {/* Минулий час */}
      <View style={styles.section}>
        <Text style={[styles.tenseTitle, { color: theme.colors.honey }]}>
          Минулий час
        </Text>
        <TenseTable forms={pastRows(entry)} accent={theme.colors.text} />
        {/* Форми дієприкметника за родом */}
        <View style={styles.participleBox}>
          <Text style={styles.participleLabel}>Дієприкметник за родом:</Text>
          <Text style={styles.participleForms}>
            <Text style={styles.pMasc}>{pp.m}</Text> (чол.) ·{" "}
            <Text style={styles.pFem}>{pp.f}</Text> (жін.) ·{" "}
            <Text style={styles.pNeut}>{pp.n}</Text> (сер.)
          </Text>
          <Text style={styles.participleForms}>
            мн.: <Text style={styles.pMasc}>{pp.manim_pl}</Text> (чол. істот.) ·{" "}
            <Text style={styles.pFem}>{pp.other_pl}</Text> (решта)
          </Text>
        </View>
      </View>

      {/* Майбутній час */}
      <View style={styles.section}>
        <Text style={[styles.tenseTitle, { color: theme.colors.lilac }]}>
          Майбутній час
        </Text>
        <TenseTable forms={futureRows(entry)} accent={theme.colors.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.space(4) },
  tenseTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: theme.space(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowAlt: { backgroundColor: "rgba(255,255,255,0.03)" },
  personCell: {
    flex: 1.3,
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2.5),
  },
  personCz: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  personUk: { color: theme.colors.textFaint, fontSize: 11 },
  formText: {
    flex: 1.7,
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2.5),
    fontSize: 15,
    fontWeight: "600",
  },
  perfNote: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
    marginBottom: theme.space(4),
  },
  perfNoteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
  participleBox: {
    marginTop: theme.space(2),
    paddingHorizontal: theme.space(1),
  },
  participleLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  participleForms: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
  pMasc: { color: theme.colors.mint, fontWeight: "700" },
  pFem: { color: "#ff8fb1", fontWeight: "700" },
  pNeut: { color: theme.colors.honey, fontWeight: "700" },
});
