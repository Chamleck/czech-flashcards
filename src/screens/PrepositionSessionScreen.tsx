import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress, PrepositionEntry } from "../types";
import { theme } from "../utils/theme";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { PosEmoji } from "../components/PosEmoji";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import CheckIcon from "lucide-react-native/icons/check";
import { PrepositionCard } from "../components/PrepositionCard";
import { PREPOSITIONS } from "../data/prepositions";
import { loadProgressFrom, saveProgressTo, updateCard, PROGRESS_KEYS } from "../utils/progress";
import { stopSpeech, useStopSpeechOnUnmount } from "../utils/useSpeech";
import { sessionStyles } from "./sessionStyles";

type Props = NativeStackScreenProps<RootStackParamList, "PrepositionSession">;

// Прийменники — незмінна частина мови, тому окрема сесія (не WordSession/
// DeclSession, ті чекають на парадигму відмінювання). Механіка self-report
// SRS та сама: показати відповідь → «Знаю»/«Ще повторити», прогрес у
// PROGRESS_KEYS.prepositions.
export function PrepositionSessionScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { title, entryIds, isMistakeRepeat } = route.params;
  useStopSpeechOnUnmount();

  const entries = useMemo(
    () => PREPOSITIONS.filter((p) => entryIds.includes(p.id)),
    [entryIds]
  );

  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ done: 0, known: 0 });

  useEffect(() => {
    loadProgressFrom(PROGRESS_KEYS.prepositions).then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  // Раунд тренування = точно те, що обрано в пікері (entries). Без
  // відкладання/фільтрації за прогресом — див. WordSessionScreen.tsx.
  const queue: PrepositionEntry[] = loaded ? entries : [];

  const finished = idx >= queue.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {queue.length > 0 && (
            <Text style={sessionStyles.counter}>
              {finished ? queue.length : idx + 1} / {queue.length}
            </Text>
          )}
          <HomeHeaderButton navigation={navigation} />
        </View>
      ),
    });
  }, [navigation, title, idx, finished, queue.length]);

  if (!loaded) {
    return (
      <View style={sessionStyles.safe}>
        <Text style={sessionStyles.loading}>Завантаження…</Text>
      </View>
    );
  }

  const current = queue[idx];

  async function answer(knewIt: boolean) {
    if (!current) return;
    stopSpeech();
    const updated = {
      ...progress,
      [current.id]: updateCard(progress[current.id], current.id, knewIt),
    };
    setProgress(updated);
    await saveProgressTo(PROGRESS_KEYS.prepositions, updated);
    setStats((s) => ({ done: s.done + 1, known: s.known + (knewIt ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  if (finished) {
    return (
      <View style={sessionStyles.safe}>
        <View style={sessionStyles.doneWrap}>
          <PosEmoji name="partyPopper" size={64} />
          <Text style={sessionStyles.doneTitle}>Готово!</Text>
          <Text style={sessionStyles.doneText}>
            Пройдено карток: {stats.done}{"\n"}
            {isMistakeRepeat ? "Вивчено" : "Знав одразу"}: {stats.known}
          </Text>
          <Pressable
            style={sessionStyles.againBtn}
            onPress={() => {
              setIdx(0);
              setStats({ done: 0, known: 0 });
            }}
          >
            <View style={sessionStyles.btnRow}>
            <RotateCcw size={16} color="#3a1f00" strokeWidth={2.5} />
            <Text style={sessionStyles.againText}>Ще раз</Text>
          </View>
          </Pressable>
          <Pressable style={sessionStyles.backHome} onPress={() => navigation.goBack()}>
            <Text style={sessionStyles.backHomeText}>Назад</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={sessionStyles.safe}>
      <View style={sessionStyles.cardArea}>
        <PrepositionCard entry={current} revealed={revealed} onReveal={() => setRevealed(true)} />
      </View>

      {revealed && (
        <View style={[sessionStyles.actions, { paddingBottom: insets.bottom + theme.space(4) }]}>
          <Pressable style={[sessionStyles.actionBtn, sessionStyles.dontKnow]} onPress={() => answer(false)}>
            <View style={sessionStyles.btnRow}>
              <RotateCcw size={16} color="#1a1020" strokeWidth={2.5} />
              <Text style={sessionStyles.actionText}>Ще повторити</Text>
            </View>
          </Pressable>
          <Pressable style={[sessionStyles.actionBtn, sessionStyles.know]} onPress={() => answer(true)}>
            <View style={sessionStyles.btnRow}>
              <CheckIcon size={16} color="#1a1020" strokeWidth={2.5} />
              <Text style={sessionStyles.actionText}>Знаю</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
