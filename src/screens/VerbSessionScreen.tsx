import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress, VerbEntry } from "../types";
import { theme } from "../utils/theme";
import { VerbCard } from "../components/VerbCard";
import { VERBS } from "../data/verbs";
import {
  loadProgressFrom,
  saveProgressTo,
  updateCard,
  buildQueue,
  PROGRESS_KEYS,
} from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "VerbSession">;

export function VerbSessionScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { title, entryIds } = route.params;

  const entries = useMemo(
    () => VERBS.filter((v) => entryIds.includes(v.id)),
    [entryIds]
  );

  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ done: 0, known: 0 });

  useEffect(() => {
    loadProgressFrom(PROGRESS_KEYS.verbs).then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const queue = useMemo<VerbEntry[]>(
    () => (loaded ? buildQueue(entries, progress) : []),
    // фіксуємо чергу лише при завантаженні
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded]
  );

  const finished = idx >= queue.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () =>
        queue.length > 0 ? (
          <Text style={styles.counter}>
            {finished ? queue.length : idx + 1} / {queue.length}
          </Text>
        ) : null,
    });
  }, [navigation, title, idx, finished, queue.length]);

  if (!loaded) {
    return (
      <View style={styles.safe}>
        <Text style={styles.loading}>Завантаження…</Text>
      </View>
    );
  }

  const current = queue[idx];

  async function answer(knewIt: boolean) {
    if (!current) return;
    const updated = {
      ...progress,
      [current.id]: updateCard(progress[current.id], current.id, knewIt),
    };
    setProgress(updated);
    await saveProgressTo(PROGRESS_KEYS.verbs, updated);
    setStats((s) => ({ done: s.done + 1, known: s.known + (knewIt ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  if (finished) {
    return (
      <View style={styles.safe}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Готово!</Text>
          <Text style={styles.doneText}>
            Пройдено карток: {stats.done}{"\n"}
            Знав одразу: {stats.known}
          </Text>
          <Pressable
            style={styles.againBtn}
            onPress={() => {
              setIdx(0);
              setStats({ done: 0, known: 0 });
            }}
          >
            <Text style={styles.againText}>Ще раз 🔁</Text>
          </Pressable>
          <Pressable style={styles.backHome} onPress={() => navigation.popToTop()}>
            <Text style={styles.backHomeText}>На головну 🏠</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.cardArea}>
        <VerbCard entry={current} revealed={revealed} onReveal={() => setRevealed(true)} />
      </View>

      {revealed && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + theme.space(4) }]}>
          <Pressable style={[styles.actionBtn, styles.dontKnow]} onPress={() => answer(false)}>
            <Text style={styles.actionText}>Ще повторити 🔁</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.know]} onPress={() => answer(true)}>
            <Text style={styles.actionText}>Знаю ✅</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  cardArea: { flex: 1, paddingHorizontal: theme.space(4), paddingTop: theme.space(2) },
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
  backHome: { marginTop: theme.space(4) },
  backHomeText: { color: theme.colors.lilac, fontSize: 15, fontWeight: "700" },
});
