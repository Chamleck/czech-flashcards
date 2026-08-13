import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { theme } from "../utils/theme";

// ТИМЧАСОВИЙ екран — лише для перевірки якості чеського TTS-голосу на пристрої.
// Не частина фінального дизайну; прибрати (файл + вхід у HomeScreen/App.tsx) після
// ухвалення рішення щодо озвучення.
const PHRASES: { label: string; text: string; note: string }[] = [
  { label: "Dobrý den", text: "Dobrý den", note: "база" },
  { label: "řeka, tři", text: "řeka, tři", note: "звук ř" },
  { label: "pás vs pas", text: "pás. Pas.", note: "довгота голосної" },
  { label: "chlapci", text: "chlapci", note: "пом'якшення перед i" },
  {
    label: "Pražský hrad je krásný.",
    text: "Pražský hrad je krásný.",
    note: "речення",
  },
];

export function TTSPrototypeScreen() {
  const insets = useSafeAreaInsets();
  const [csVoices, setCsVoices] = useState<Speech.Voice[] | null>(null);
  const [rate, setRate] = useState(1.0);
  const [speaking, setSpeaking] = useState<string | null>(null);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((all) => setCsVoices(all.filter((v) => v.language?.toLowerCase().startsWith("cs"))))
      .catch(() => setCsVoices([]));
  }, []);

  async function play(text: string, label: string) {
    await Speech.stop(); // не даємо звукам накладатись один на одного
    setSpeaking(label);
    Speech.speak(text, {
      language: "cs-CZ",
      rate,
      onDone: () => setSpeaking(null),
      onStopped: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.h1}>🔊 Тест голосу (тимчасово)</Text>
      <Text style={styles.hint}>
        Перевірка якості системного TTS для чеської. Цей екран — не фінальна фіча.
      </Text>

      <View style={styles.voicesBox}>
        <Text style={styles.voicesTitle}>Чеські голоси на пристрої:</Text>
        {csVoices === null && <Text style={styles.voicesText}>Перевіряю…</Text>}
        {csVoices !== null && csVoices.length === 0 && (
          <>
            <Text style={styles.voicesTextWarn}>Жодного чеського голосу не знайдено.</Text>
            <Text style={styles.voicesHelp}>
              Що зробити: Налаштування → Загальні налаштування (або "Система") → Мова та
              введення → Синтез мовлення (Text-to-speech) → обери "Google" як рушій → тапни ⚙️
              поруч із ним → "Встановити мовні дані" → знайди чеську (Čeština/cs-CZ) → завантаж.
              Якщо рушія Google немає у списку — постав застосунок "Служби озвучування від
              Google" (Speech Services by Google) з Play Маркету.
            </Text>
          </>
        )}
        {csVoices !== null &&
          csVoices.map((v) => (
            <Text key={v.identifier} style={styles.voicesText}>
              • {v.name} ({v.language}, {v.quality})
            </Text>
          ))}
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Швидкість:</Text>
        {[0.75, 1.0].map((r) => (
          <Pressable
            key={r}
            style={[styles.rateBtn, rate === r && styles.rateBtnActive]}
            onPress={() => setRate(r)}
          >
            <Text style={[styles.rateBtnText, rate === r && styles.rateBtnTextActive]}>
              {r === 1.0 ? "звичайна" : "повільніше"}
            </Text>
          </Pressable>
        ))}
      </View>

      {PHRASES.map((p) => (
        <Pressable
          key={p.label}
          style={[styles.phraseRow, speaking === p.label && styles.phraseRowActive]}
          onPress={() => play(p.text, p.label)}
        >
          <Text style={styles.phraseIcon}>{speaking === p.label ? "🔊" : "▶️"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.phraseText}>{p.label}</Text>
            <Text style={styles.phraseNote}>{p.note}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  h1: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 4, marginBottom: theme.space(4) },
  voicesBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(4),
  },
  voicesTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700", marginBottom: 6 },
  voicesText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
  voicesTextWarn: { color: theme.colors.coral, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  voicesHelp: { color: theme.colors.textDim, fontSize: 12, lineHeight: 18 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: theme.space(2), marginBottom: theme.space(4) },
  rateLabel: { color: theme.colors.textDim, fontSize: 13, marginRight: 4 },
  rateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bgElevated,
  },
  rateBtnActive: { backgroundColor: theme.colors.lilac },
  rateBtnText: { color: theme.colors.textDim, fontSize: 12, fontWeight: "700" },
  rateBtnTextActive: { color: "#1a1020" },
  phraseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(2.5),
  },
  phraseRowActive: { borderWidth: 1.5, borderColor: theme.colors.mint },
  phraseIcon: { fontSize: 20 },
  phraseText: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  phraseNote: { color: theme.colors.textFaint, fontSize: 12, marginTop: 1 },
});
