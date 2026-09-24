import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { VerbEntry, PERSON_ORDER, PERSON_LABELS } from "../types";
import { theme } from "../utils/theme";
import { TileEmoji } from "./TileEmoji";
import { Speakable } from "./Speakable";
import { InfoBanner } from "./InfoBanner";
import { ClickableWord, AppNav } from "./ClickableWord";
import {
  presentForm,
  futureForm,
  pastForm,
  imperativeForm,
  IMPERATIVE_ORDER,
  IMPERATIVE_LABELS,
} from "../utils/verbForms";

type Mode = "present" | "past" | "future" | "imperative";

// Таблиця з довільними підписами рядків (особа/підмет → форма).
// speakIdBase: якщо переданий, кожна форма озвучувана з id `${speakIdBase}:{i}`.
function FormTable({
  labels,
  forms,
  accent,
  speakIdBase,
}: {
  labels: { cz: string; uk: string }[];
  forms: { cz: string }[];
  accent: string;
  speakIdBase?: string;
}) {
  return (
    <View style={styles.table}>
      {labels.map((lbl, i) => (
        <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.personCell}>
            <Text style={styles.personCz}>{lbl.cz}</Text>
            <Text style={styles.personUk}>{lbl.uk}</Text>
          </View>
          {speakIdBase && forms[i].cz ? (
            <Speakable
              id={`${speakIdBase}:${i}`}
              text={forms[i].cz}
              style={[styles.formText, { color: accent }]}
            />
          ) : (
            <Text style={[styles.formText, { color: accent }]}>{forms[i].cz}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// Рядки таблиці для теперішнього часу (6 стандартних осіб).
function presentRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => ({ cz: presentForm(v, p) ?? "" }));
}

// Рядки для майбутнього часу.
function futureRows(v: VerbEntry) {
  return PERSON_ORDER.map((p) => ({ cz: futureForm(v, p) }));
}

// Рядки для минулого часу — у таблиці показуємо базово чол. рід для он/они
// (повний розклад за родом — окремим блоком нижче).
function pastRows(v: VerbEntry) {
  const map: Record<string, "ja" | "ty" | "on" | "my" | "vy" | "oni_manim"> = {
    ja: "ja",
    ty: "ty",
    on: "on",
    my: "my",
    vy: "vy",
    oni: "oni_manim",
  };
  return PERSON_ORDER.map((p) => ({ cz: pastForm(v, map[p]) }));
}

// Рядки для наказового способу (3 форми: ty/vy/my).
function imperativeRows(v: VerbEntry) {
  return IMPERATIVE_ORDER.map((p) => ({ cz: imperativeForm(v, p) ?? "" }));
}

const MODE_META: Record<Mode, { label: string; color: string }> = {
  present: { label: "Теперішній", color: theme.colors.mint },
  past: { label: "Минулий", color: theme.colors.honey },
  future: { label: "Майбутній", color: theme.colors.lilac },
  imperative: { label: "Наказовий", color: theme.colors.coral },
};

// Стандартні підписи 6 осіб (для теп./мин./майб.).
const PERSON_ROW_LABELS = PERSON_ORDER.map((p) => PERSON_LABELS[p]);
// Підписи 3 осіб наказового способу.
const IMPERATIVE_ROW_LABELS = IMPERATIVE_ORDER.map((p) => IMPERATIVE_LABELS[p]);

export function VerbConjugation({
  entry,
  navigation,
  linkMode = "push",
}: {
  entry: VerbEntry;
  // Опційні: без них видовий партнер лишається звичайним текстом (fallback,
  // не крашиться) — потрібні лише щоб зробити партнера клікабельним.
  navigation?: AppNav;
  linkMode?: "push" | "replace";
}) {
  const isPerfective = entry.aspect === "perfective";
  const hasImperative = !!entry.imperative;

  // Доступні таби: доконаний вид не має теперішнього; наказовий — лише якщо є.
  const modes: Mode[] = [
    ...(isPerfective ? (["past", "future"] as Mode[]) : (["present", "past", "future"] as Mode[])),
    ...(hasImperative ? (["imperative"] as Mode[]) : []),
  ];
  // Стартовий таб: у доконаного — "past", інакше "present".
  const [mode, setMode] = useState<Mode>(isPerfective ? "past" : "present");

  const pp = entry.pastParticiple;

  const rows =
    mode === "present"
      ? presentRows(entry)
      : mode === "past"
      ? pastRows(entry)
      : mode === "future"
      ? futureRows(entry)
      : imperativeRows(entry);

  const rowLabels = mode === "imperative" ? IMPERATIVE_ROW_LABELS : PERSON_ROW_LABELS;

  // Приклад для поточного режиму.
  const example =
    mode === "present"
      ? entry.examples.present
      : mode === "past"
      ? entry.examples.past
      : mode === "future"
      ? entry.examples.future
      : entry.examples.imperative;

  // Робимо видового партнера клікабельним, лише якщо текст примітки почина-
  // ється з надійного, передбачуваного шаблону "(не)доконаний партнер: X" —
  // а не намагаючись розпарсити довільний текст (32 з 158 приміток мають
  // геть іншу форму: "нерегулярне; ...", "самостійне (без пари)" тощо — для
  // них parseAspectPairNote поверне null, і примітка лишиться звичайним
  // текстом, як і була). Ціль кліку — ЗАВЖДИ entry.aspectPairId (структурне
  // поле, перевірене на 100% взаємність окремим скриптом), НІКОЛИ не текст,
  // що витягнули регуляркою, — regex лише вирішує ДЕ в реченні розрізати на
  // клікабельне слово, не ЩО насправді відкриється.
  function parseAspectPairNote(note: string): { prefix: string; word: string; suffix: string } | null {
    // Без прив'язки до початку рядка (^) — 2 записи (vzit, stat-se) мають
    // префікс перед шаблоном ("нерегулярне доконане; недоконаний партнер:
    // ..."), і заякорений варіант їх пропускав. Безпечно: незалежно від ТОГО,
    // ДЕ в тексті знайдеться фраза, увесь текст до неї включно йде в prefix
    // (без втрати змісту), а ціль кліку — завжди entry.aspectPairId, ніколи
    // не сам знайдений текст.
    const labelMatch = note.match(/(недоконаний партнер|доконаний партнер): /);
    if (!labelMatch || labelMatch.index === undefined) return null;
    const prefix = note.slice(0, labelMatch.index + labelMatch[0].length);
    const afterLabel = note.slice(prefix.length);
    const wordMatch = afterLabel.match(/^[^\s(]+/);
    if (!wordMatch) return null;
    return { prefix, word: wordMatch[0], suffix: afterLabel.slice(wordMatch[0].length) };
  }

  function renderAspectPairNote(note: string): React.ReactNode {
    if (navigation && entry.aspectPairId) {
      const parsed = parseAspectPairNote(note);
      if (parsed) {
        return (
          <>
            {parsed.prefix}
            <ClickableWord word={parsed.word} wordId={entry.aspectPairId} kind="verbs" navigation={navigation} mode={linkMode} />
            {parsed.suffix}
          </>
        );
      }
    }
    return note; // без navigation/aspectPairId або нерозпізнаний формат — як і раніше, простий текст
  }

  // Обидва факти нижче — глобальні для слова (не залежать від обраного табу),
  // тому рендеряться в ОДНОМУ банері "Важливо" одразу над табами, а не як два
  // окремі банери поспіль (colnote1: відсутність теп. часу; colnote2: видова
  // пара) — раніше видова пара була окремим банером у самому кінці картки
  // (VerbCard.tsx), що виглядало як дубль-за-змістом банер під "Зверніть
  // увагу" відразу під прикладом речення поточного табу.
  const globalNoteParagraphs: React.ReactNode[] = [
    ...(isPerfective
      ? ["Доконаний вид не має теперішнього часу. Його «теперішня» дієвідміна за значенням є майбутньою."]
      : []),
    ...(entry.aspectPairNote ? [renderAspectPairNote(entry.aspectPairNote)] : []),
  ];

  return (
    <View>
      {/* Банер про слово загалом — видно завжди, незалежно від табу */}
      {globalNoteParagraphs.length > 0 && <InfoBanner paragraphs={globalNoteParagraphs} />}

      {/* Перемикач режимів (flexWrap — переносить на 2 ряди, коли табів 4) */}
      <View style={styles.segment}>
        {modes.map((t) => {
          const active = t === mode;
          const m = MODE_META[t];
          return (
            <Pressable
              key={t}
              style={[styles.segBtn, active && { backgroundColor: m.color }]}
              onPress={() => setMode(t)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Банер наказового способу — лише під табом "Наказовий" */}
      {mode === "imperative" && (
        <InfoBanner
          paragraphs={[
            "Наказовий спосіб має лише 3 форми: ty (ти), vy (ви) і my (закличне «зробімо»). Для «він/вона» використовують конструкцію «ať to udělá» (нехай зробить).",
          ]}
        />
      )}

      {/* Таблиця форм поточного режиму */}
      <View style={styles.section}>
        <FormTable
          labels={rowLabels}
          forms={rows}
          accent={theme.colors.text}
          speakIdBase={`${entry.id}:${mode}`}
        />

        {/* Форми дієприкметника за родом — лише під табом "Минулий" */}
        {mode === "past" && (
          <View style={styles.participleBox}>
            <Text style={styles.participleLabel}>Дієприкметник за родом:</Text>
            <View style={styles.participleRow}>
              <Speakable id={`${entry.id}:pp:m`} text={pp.m} style={[styles.participleForms, styles.pMasc]} />
              <Text style={styles.participleForms}> (чол.) · </Text>
              <Speakable id={`${entry.id}:pp:f`} text={pp.f} style={[styles.participleForms, styles.pFem]} />
              <Text style={styles.participleForms}> (жін.) · </Text>
              <Speakable id={`${entry.id}:pp:n`} text={pp.n} style={[styles.participleForms, styles.pNeut]} />
              <Text style={styles.participleForms}> (сер.)</Text>
            </View>
            <View style={styles.participleRow}>
              <Text style={styles.participleForms}>мн.: </Text>
              <Speakable
                id={`${entry.id}:pp:manim_pl`}
                text={pp.manim_pl}
                style={[styles.participleForms, styles.pMasc]}
              />
              <Text style={styles.participleForms}> (чол. істот.) · </Text>
              <Speakable
                id={`${entry.id}:pp:other_pl`}
                text={pp.other_pl}
                style={[styles.participleForms, styles.pFem]}
              />
              <Text style={styles.participleForms}> (решта)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Приклад речення для поточного режиму */}
      {example && (
        <View style={styles.example}>
          <View style={styles.exampleRow}>
            <TileEmoji name="speechBalloon" size={15} />
            <Speakable id={`${entry.id}:${mode}:example`} text={example.cz} style={styles.exampleCz} />
          </View>
          <Text style={styles.exampleUk}>{example.uk}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.space(3) },
  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.space(3),
  },
  segBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 90,
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  segText: { color: theme.colors.textDim, fontSize: 13, fontWeight: "700" },
  segTextActive: { color: "#1a1020" },
  table: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowAlt: { backgroundColor: "rgba(255,255,255,0.03)" },
  personCell: { flex: 1.3, paddingVertical: theme.space(2), paddingHorizontal: theme.space(2.5) },
  personCz: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  personUk: { color: theme.colors.textFaint, fontSize: 11 },
  formText: {
    flex: 1.7,
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2.5),
    fontSize: 15,
    fontWeight: "600",
  },
  participleBox: { marginTop: theme.space(2), paddingHorizontal: theme.space(1) },
  participleLabel: { color: theme.colors.textDim, fontSize: 12, fontWeight: "700", marginBottom: 2 },
  participleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  participleForms: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
  pMasc: { color: theme.colors.mint, fontWeight: "700" },
  pFem: { color: "#ff8fb1", fontWeight: "700" },
  pNeut: { color: theme.colors.honey, fontWeight: "700" },
  example: {
    marginTop: theme.space(4),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
