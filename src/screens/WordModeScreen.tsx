import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { NOUNS } from "../data/nouns";
import { CardProgress } from "../types";
import { theme } from "../utils/theme";
import { FlashCard } from "../components/FlashCard";
import { loadProgress, saveProgress, updateCard, buildQueue } from "../utils/progress";

export function WordModeScreen({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ done: 0, known: 0 });

  useEffect(() => {
    loadProgress().then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const queue = useMemo(
    () => (loaded ? buildQueue(NOUNS, progress) : []),
    // навмисно фіксуємо чергу лише при завантаженні, щоб картки не перестрибували
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded]
  );

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Завантаження…</Text>
      </SafeAreaView>
    );
  }

  const current = queue[idx];
  const finished = idx >= queue.length;

  async function answer(knewIt: boolean) {
    if (!current) return;
    const updated = { ...progress, [current.id]: updateCard(progress[current.id], current.id, knewIt) };
    setProgress(updated);
    await saveProgress(updated);
    setStats((s) => ({ done: s.done + 1, known: s.known + (knewIt ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.counter}>
          {finished ? queue.length : idx + 1} / {queue.length}
        </Text>
      </View>

      {finished ? (
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Готово!</Text>
          <Text style={styles.doneText}>
            Пройдено карток: {stats.done}{"\n"}
            Знав одразу: {stats.known}
          </Text>
          <Pressable style={styles.againBtn} onPress={() => { setIdx(0); setStats({ done: 0, known: 0 }); }}>
            <Text style={styles.againText}>Ще раз 🔁</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.cardArea}>
            <FlashCard entry={current} revealed={revealed} onReveal={() => setRevealed(true)} />
          </View>

          {revealed && (
            <View style={styles.actions}>
              <Pressable style={[styles.actionBtn, styles.dontKnow]} onPress={() => answer(false)}>
                <Text style={styles.actionText}>Ще повторити 🔁</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.know]} onPress={() => answer(true)}>
                <Text style={styles.actionText}>Знаю ✅</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  back: { color: theme.colors.lilac, fontSize: 16, fontWeight: "600" },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  cardArea: { flex: 1, paddingHorizontal: theme.space(4) },
  actions: { flexDirection: "row", gap: theme.space(3), padding: theme.space(4) },
  actionBtn: { flex: 1, paddingVertical: theme.space(4), borderRadius: theme.radius.md, alignItems: "center" },
  dontKnow: { backgroundColor: theme.colors.coral },
  know: { backgroundColor: theme.colors.mint },
  actionText: { color: "#1a1020", fontWeight: "800", fontSize: 15 },
  doneWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.space(6) },
  doneEmoji: { fontSize: 64 },
  doneTitle: { color: theme.colors.text, fontSize: 26, fontWeight: "800", marginTop: 8 },
  doneText: { color: theme.colors.textDim, fontSize: 16, textAlign: "center", marginTop: 12, lineHeight: 24 },
  againBtn: {
    marginTop: theme.space(6),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(8),
    borderRadius: theme.radius.md,
  },
  againText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
});
