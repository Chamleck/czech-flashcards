import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { CONJUNCTIONS } from "../data/conjunctions";
import { CONJUNCTIONS_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "ConjunctionSelection">;

export function ConjunctionSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: CONJUNCTIONS_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={CONJUNCTIONS}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: CONJUNCTIONS_TITLE, kind: "service-word", entryIds: ids })
      }
    />
  );
}
