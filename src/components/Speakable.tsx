import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, TextStyle, StyleSheet, Easing } from "react-native";
import { speak, useSpeakingId } from "../utils/useSpeech";

interface Props {
  id: string;
  text: string;
  style?: StyleProp<TextStyle>;
}

// Тапабельний озвучуваний текст. ЄДИНИЙ ефект скрізь — пригасання (opacity):
//  • Постійна ознака "можна почути" — суцільне підкреслення (Android і так малює
//    підкреслення суцільним, dotted ігнорується — тому не вигадуємо пунктир).
//  • Пульс при появі картки — усі озвучувані слова ОДНОЧАСНО на мить пригасають і
//    повертаються (натяк на можливість взаємодії, як мерехтіння предмета в іграх).
//  • Під час програвання — слово пригасає й ТРИМАЄТЬСЯ пригашеним, поки звучить,
//    потім повертає яскравість.
//
// Чому саме opacity (а не фон-плашка / колір / жирність): плашка з рівним
// заокругленням надійна лише на окремому тексті, а на вкладеному в речення RN
// малює її криво; колір збігається з граматичною палітрою (рід/відмінок/ступінь);
// fontWeight зсуває верстку. opacity не має жодної з цих вад і працює однаково
// на будь-якому тексті — окремому й вкладеному. useNativeDriver: true (плавно).
const DIM = 0.4;

export function Speakable({ id, text, style }: Props) {
  const speakingId = useSpeakingId();
  const active = speakingId === id;
  const opacity = useRef(new Animated.Value(1)).current;

  // Пульс при монтуванні (один раз, одночасно з усіма словами картки): 1 → DIM → 1.
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: DIM, duration: 260, delay: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
    // навмисно лише при монтуванні
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Стан програвання має пріоритет над пульсом: поки active — тримаємо DIM;
  // щойно перестало звучати — плавно повертаємо яскравість.
  // ВАЖЛИВО: на першому рендері (монтуванні) цей ефект НЕ чіпає opacity, якщо
  // нічого не звучить — інакше він одразу перебив би пульс (обидва пишуть в одне
  // значення). Після монтування active-переходи керують opacity.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (!active) return; // віддаємо opacity пульсу
    }
    Animated.timing(opacity, {
      toValue: active ? DIM : 1,
      duration: active ? 160 : 300,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, opacity]);

  return (
    <Animated.Text
      style={[style, styles.speakable, { opacity }]}
      onPress={() => speak(text, id)}
      suppressHighlighting
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  speakable: { textDecorationLine: "underline" },
});
