import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { getQuizSounds } from "../utils/soundCache";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { generateSession, Question } from "../utils/flashcardEngine";
import { loadFlashcardStats, saveFlashcardStats, mergeSession } from "../utils/flashcardStats";
import {
  loadMistakes,
  saveMistakes,
  recordAnswer,
  MistakeStore,
} from "../utils/flashcardWeights";

type Props = NativeStackScreenProps<RootStackParamList, "FlashcardsQuiz">;

const SESSION_LEN = 12;

export function FlashcardsQuizScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { title } = route.params;

  const [session, setSession] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selectedWrong, setSelectedWrong] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0, streak: 0, best: 0 });
  const [newRecord, setNewRecord] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);
  // Ваги помилок по comboId — тримаємо в ref, щоб оновлення між відповідями/сесіями
  // не спричиняли зайвих ре-рендерів. Персистяться в AsyncStorage.
  const mistakes = useRef<MistakeStore>({});

  useEffect(() => {
    (async () => {
      const m = await loadMistakes();
      mistakes.current = m;
      setSession(generateSession(SESSION_LEN, undefined, m));
    })();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () =>
        session.length > 0 ? (
          <Text style={styles.counter}>
            {Math.min(idx + 1, session.length)} / {session.length}
          </Text>
        ) : null,
    });
  }, [navigation, title, idx, session.length]);

  // Звуки завантажуються й "прогріваються" ОДИН РАЗ за час роботи застосунку
  // (див. soundCache.ts) — тут лише беремо вже готові об'єкти з кешу. Це усуває
  // вікно тиші, яке раніше повторювалось у КОЖНОМУ новому раунді через те, що
  // екран квізу перезавантажував звуки й audio mode при кожному вході.
  useEffect(() => {
    let mounted = true;
    getQuizSounds()
      .then(({ correct, wrong }) => {
        if (!mounted) return;
        correctSound.current = correct;
        wrongSound.current = wrong;
      })
      .catch(() => {
        // звук не критичний — гра працює й без нього
      });
    return () => {
      mounted = false;
      // НЕ вивантажуємо звуки — вони живуть у кеші на весь час роботи застосунку,
      // щоб наступний вхід у квіз не проходив через нове вікно тиші.
    };
  }, []);

  async function play(ref: React.MutableRefObject<Audio.Sound | null>) {
    try {
      await ref.current?.replayAsync();
    } catch {
      // ігноруємо
    }
  }

  function runShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: -9, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 9, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }

  const current = session[idx];
  const finished = session.length > 0 && idx >= session.length;

  function onPick(option: string, optionIdx: number) {
    if (solved || !current) return;

    if (option === current.correct) {
      const firstTry = selectedWrong === null;
      play(correctSound);
      setSolved(true);
      // Трекінг помилок по комбінації: перша спроба вірна → зараховуємо як правильну
      // (наближає затухання ваги); якщо перед цим був промах — комбінація вже позначена
      // помилковою нижче, у гілці else, тож тут не перезараховуємо як правильну.
      if (firstTry) {
        mistakes.current = recordAnswer(mistakes.current, current.comboId, true);
        saveMistakes(mistakes.current);
      }
      setStats((s) => {
        const streak = firstTry ? s.streak + 1 : 0;
        return {
          answered: s.answered + 1,
          correct: s.correct + (firstTry ? 1 : 0),
          streak,
          best: Math.max(s.best, streak),
        };
      });
      setTimeout(() => {
        setSelectedWrong(null);
        setSolved(false);
        setIdx((i) => i + 1);
      }, 750);
    } else {
      play(wrongSound);
      runShake();
      // Помилка на цій комбінації → підвищуємо її вагу (BOOST) на майбутні сесії.
      mistakes.current = recordAnswer(mistakes.current, current.comboId, false);
      saveMistakes(mistakes.current);
      setSelectedWrong(optionIdx);
      setStats((s) => ({ ...s, streak: 0 }));
    }
  }

  // Збереження підсумку сесії у накопичену статистику
  useEffect(() => {
    if (!finished) return;
    (async () => {
      const prev = await loadFlashcardStats();
      const { stats: next, newRecord: broke } = mergeSession(prev, {
        answered: stats.answered,
        correct: stats.correct,
        bestStreak: stats.best,
      });
      await saveFlashcardStats(next);
      setNewRecord(broke);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (session.length === 0) {
    return (
      <View style={styles.safe}>
        <Text style={styles.loading}>Готуємо картки…</Text>
      </View>
    );
  }

  if (finished) {
    const pct = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
    return (
      <View style={styles.safe}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</Text>
          <Text style={styles.doneTitle}>Сесію завершено!</Text>
          <Text style={styles.doneScore}>{stats.correct} / {stats.answered}</Text>
          <Text style={styles.doneText}>
            Точність: {pct}%{"\n"}Найкраща серія: {stats.best}
          </Text>
          {newRecord && (
            <Text style={styles.recordBanner}>🏆 Новий рекорд раунду!</Text>
          )}
          <Pressable
            style={styles.againBtn}
            onPress={() => {
              setSession(generateSession(SESSION_LEN, undefined, mistakes.current));
              setIdx(0);
              setSelectedWrong(null);
              setSolved(false);
              setStats({ answered: 0, correct: 0, streak: 0, best: 0 });
              setNewRecord(false);
            }}
          >
            <Text style={styles.againText}>Ще сесія 🔁</Text>
          </Pressable>
          <Pressable
            style={styles.backBtn}
            onPress={() =>
              navigation.navigate("FlashcardsCategories", { justFinishedRound: true })
            }
          >
            <Text style={styles.backText}>До категорій</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.top}>
        {stats.streak >= 2 && <Text style={styles.streak}>🔥 Серія: {stats.streak}</Text>}
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>слово 🇨🇿</Text>
          <Text style={styles.promptWord}>{current.promptWord}</Text>
          <Text style={styles.promptUk}>{current.promptUk}</Text>
          <View style={styles.taskBox}>
            <Text style={styles.taskText}>{current.taskText}</Text>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.options, { transform: [{ translateX: shake }] }]}>
        {current.options.map((opt, i) => {
          const isCorrect = solved && opt === current.correct;
          const isWrong = selectedWrong === i;
          return (
            <Pressable
              key={i}
              style={[
                styles.optionCard,
                isCorrect && styles.optionCorrect,
                isWrong && styles.optionWrong,
              ]}
              onPress={() => onPick(opt, i)}
              disabled={solved || isWrong}
            >
              <Text
                style={[
                  styles.optionText,
                  (isCorrect || isWrong) && styles.optionTextActive,
                ]}
              >
                {opt}
              </Text>
              {isCorrect && <Text style={styles.mark}>✓</Text>}
              {isWrong && <Text style={styles.mark}>✕</Text>}
            </Pressable>
          );
        })}
      </Animated.View>

      <View style={{ height: insets.bottom + theme.space(3) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: theme.space(4) },
  loading: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  top: { flex: 1, justifyContent: "center" },
  streak: { color: theme.colors.honey, fontSize: 15, fontWeight: "800", textAlign: "center", marginBottom: theme.space(3) },
  promptCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
    alignItems: "center",
  },
  promptLabel: { color: theme.colors.textDim, fontSize: 13 },
  promptWord: { color: theme.colors.text, fontSize: 34, fontWeight: "900", marginTop: 4 },
  promptUk: { color: theme.colors.textDim, fontSize: 16, marginTop: 2 },
  taskBox: {
    marginTop: theme.space(4),
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(4),
  },
  taskText: { color: theme.colors.honey, fontSize: 16, fontWeight: "700", textAlign: "center" },
  options: { gap: theme.space(3), paddingBottom: theme.space(4) },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space(2),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: theme.space(5),
  },
  optionCorrect: { borderColor: theme.colors.mint, backgroundColor: "rgba(78,205,196,0.15)" },
  optionWrong: { borderColor: theme.colors.coral, backgroundColor: "rgba(255,107,107,0.15)" },
  optionText: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  optionTextActive: { fontWeight: "800" },
  mark: { fontSize: 20, fontWeight: "900", color: theme.colors.text },
  doneWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.space(4) },
  doneEmoji: { fontSize: 64 },
  doneTitle: { color: theme.colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 },
  doneScore: { color: theme.colors.honey, fontSize: 40, fontWeight: "900", marginTop: theme.space(3) },
  doneText: { color: theme.colors.textDim, fontSize: 16, textAlign: "center", marginTop: theme.space(2), lineHeight: 24 },
  recordBanner: {
    color: theme.colors.honey,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: theme.space(4),
  },
  againBtn: {
    marginTop: theme.space(6),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(8),
    borderRadius: theme.radius.md,
  },
  againText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  backBtn: { marginTop: theme.space(4) },
  backText: { color: theme.colors.lilac, fontSize: 15, fontWeight: "700" },
});
