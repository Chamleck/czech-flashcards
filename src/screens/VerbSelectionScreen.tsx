import React, { useLayoutEffect, useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { VERBS } from "../data/verbs";
import { VERB_CLASS_BY_KEY } from "../data/verbCategories";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "VerbSelection">;

export function VerbSelectionScreen({ route, navigation }: Props) {
  const { verbClass } = route.params;
  const meta = VERB_CLASS_BY_KEY[verbClass];

  // cz — уже готовий інфінітив (з реф. часткою, якщо є) для рядка вибору;
  // aspect лишаємо поруч для бейджа док./недок. Кольори cz для всього класу
  // однакові (meta.color), тому czColor — константний колбек, не per-item
  // обчислення, але той самий проп, що й у Іменників (там per-item за родом).
  const words = useMemo(
    () =>
      VERBS.filter((v) => v.verbClass === verbClass).map((v) => ({
        id: v.id,
        uk: v.uk,
        cz: v.reflexive ? `${v.cz} ${v.reflexive}` : v.cz,
        aspect: v.aspect,
      })),
    [verbClass]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meta.title,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation, meta]);

  return (
    <SelectionList
      words={words}
      czColor={() => meta.color}
      renderExtra={(w) => (
        <Text style={styles.aspect}>{w.aspect === "perfective" ? "док." : "недок."}</Text>
      )}
      onStart={(ids) => navigation.navigate("VerbSession", { title: meta.title, entryIds: ids })}
    />
  );
}

const styles = StyleSheet.create({
  aspect: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
});
