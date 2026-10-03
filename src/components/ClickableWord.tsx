import React from "react";
import { Text, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, BrowseKind } from "../types";
import { ParagraphSegment } from "../data/grammar";
import { openLinkedWord } from "../utils/linkNavigation";
import { theme } from "../utils/theme";

// Generic nav handle usable from ANY screen in the stack (not tied to one
// route name) — every screen's `navigation` prop is structurally assignable
// here, since they all share the same RootStackParamList.
export type AppNav = NativeStackNavigationProp<RootStackParamList>;

// Клікабельне слово всередині речення — відкриває картку слова в словнику
// (BrowseCard). Стиль СВІДОМО відрізняється від Speakable (озвучення): колір
// lilac (уже зарезервований у темі під "інформацію"), БЕЗ підкреслення й БЕЗ
// анімації — щоб два різні жести (почути / відкрити картку) не виглядали
// однаково. Nested-Text-з-onPress — той самий безпечний патерн, що вже working
// у caseCz (кольоровий Text всередині Text) і в Speakable (Text з onPress).
//
// mode="push" (за замовчуванням) — один push на поточний стек: "назад" веде
// туди, звідки тапнули. Правильно для ПЕРШОГО переходу (з граматики, з
// тренування, зі звичайного перегляду) — джерело лишається під низом стека.
// mode="replace" — заміняє поточний екран замість додавання: використовується
// САМЕ на BrowseCard, коли клікабельне слово веде на ІНШУ картку слова В ТОМУ
// САМОМУ розділі (напр. видові партнери дієслів, aby↔kdyby) — інакше тап
// туди-сюди між двома картками нескінченно роздував би стек навігації.
// Вибір між push, replace і перебудовою стека робить НЕ цей компонент, а
// resolveLinkAction (utils/linkNavigation.ts) за фактичним станом стека: ціль в іншому
// СПИСКУ (інший розділ чи інша підкатегорія, напр. létat V клас ↔ letět IV клас) дає
// ланцюжок «меню → розділ → список → картка», картка з тренування чи граматики завжди
// робить replace (назад → тренування/граматика).
export function ClickableWord({
  word,
  wordId,
  kind,
  navigation,
  mode = "push",
}: {
  word: string;
  wordId: string;
  kind: BrowseKind;
  navigation: AppNav;
  mode?: "push" | "replace";
}) {
  function onPress() {
    openLinkedWord(navigation, mode, wordId, kind);
  }

  return (
    <Text style={styles.clickableWord} onPress={onPress} suppressHighlighting>
      {word}
    </Text>
  );
}

export function Segments({
  segments,
  navigation,
  mode = "push",
}: {
  segments: ParagraphSegment[];
  navigation: AppNav;
  mode?: "push" | "replace";
}) {
  return (
    <>
      {segments.map((seg, i) =>
        "word" in seg ? (
          <ClickableWord key={i} word={seg.word} wordId={seg.wordId} kind={seg.kind} navigation={navigation} mode={mode} />
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  clickableWord: { color: theme.colors.lilac, fontWeight: "700" },
});
