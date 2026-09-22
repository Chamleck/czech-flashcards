import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { INTERROGATIVE_ADVERBS } from "../data/interrogativeAdverbs";
import { INTERROGATIVE_ADVERBS_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "InterrogativeAdverbSelection">;

export function InterrogativeAdverbSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: INTERROGATIVE_ADVERBS_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={INTERROGATIVE_ADVERBS}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: INTERROGATIVE_ADVERBS_TITLE, kind: "interrogative", entryIds: ids })
      }
    />
  );
}
