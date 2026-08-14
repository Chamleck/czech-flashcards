import React, { useEffect, useRef, useState } from "react";
import { View, Animated, StyleSheet, LayoutChangeEvent } from "react-native";

// Одноразовий світловий перелив по вмісту при появі картки — сигналізує "тут є
// що послухати", без постійної анімації (не гріє батарею, не відволікає під час
// читання). Точну "промову" робить Speakable (підкреслення); шимер — лише
// декоративний акцент у момент відкриття, над усім розкритим блоком одразу.
// Вбудований Animated (без сторонніх бібліотек) — надійний, useNativeDriver.
export function ShimmerOnMount({ children }: { children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (w === 0 || started.current) return;
    started.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, [w, progress]);

  function onLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && w === 0) setW(width);
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-w, w],
  });

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      {children}
      {w > 0 && (
        <Animated.View
          style={[
            styles.band,
            { width: Math.max(w * 0.4, 60), transform: [{ translateX }, { rotate: "18deg" }] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", overflow: "hidden" },
  band: {
    position: "absolute",
    top: -60,
    bottom: -60,
    pointerEvents: "none",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
