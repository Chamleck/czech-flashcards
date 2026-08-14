import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, TextStyle, StyleSheet, Easing } from "react-native";
import { theme } from "../utils/theme";
import { speak, useSpeakingId } from "../utils/useSpeech";

interface Props {
  id: string;
  text: string;
  style?: StyleProp<TextStyle>;
}

// Тапабельний озвучуваний текст.
//
// Ознака "можна почути" — пунктирне підкреслення (постійна) + одночасний м'який
// "спалах" усіх озвучуваних слів у момент відкриття картки (як мерехтіння
// інтерактивного предмета в іграх: ненав'язливо показує, з чим можна взаємодіяти).
// Спалах не по черзі, а одразу на всіх словах разом.
//
// Підсвітка ПІД ЧАС програвання — напівпрозора ФОНОВА плашка, а не зміна кольору
// тексту: колір тексту в застосунку вже означає рід/відмінок/ступінь (напр.
// дієприкметник чол. роду має м'ятний колір — той самий, що був би підсвіткою),
// тож зміна кольору була б невидимою на частині слів. Фон видно на будь-якому
// кольорі тексту й він не займає жодного кольору з граматичної палітри.
export function Speakable({ id, text, style }: Props) {
  const speakingId = useSpeakingId();
  const active = speakingId === id;

  // Спалах при появі (один раз): 0 → 1 → 0.
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 260, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: false }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [flash]);

  // Фон: під час програвання — стала плашка; поза тим — короткий спалах при появі.
  // (useNativeDriver: false, бо анімуємо backgroundColor.)
  const flashBg = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,0.16)"],
  });

  return (
    <Animated.Text
      style={[
        style,
        styles.speakable,
        { backgroundColor: active ? theme.colors.speakActiveBg : flashBg },
      ]}
      onPress={() => speak(text, id)}
      suppressHighlighting
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  speakable: { textDecorationLine: "underline", textDecorationStyle: "dotted" },
});
