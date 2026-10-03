import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import { RootStackParamList, BrowseKind } from "../types";
import { findSearchEntry } from "./searchIndex";

// Єдине місце, яке вирішує, ЯК клікабельне слово відкриває картку (ClickableWord лише викликає
// openLinkedWord). Правило «назад»: після переходу по посиланню «назад» іде ТІЄЮ САМОЮ послідовністю
// виходу, що й після звичайного тапу по категорії цілі: слова підкатегорії (BrowseList) → вибір
// підкатегорії/розділу (напр. VerbCategories) → меню частин мови (WordsPartOfSpeech) → Home.
// Картка, з якої тапнули, у цю послідовність НЕ входить.
//
//   push      — перший перехід (з граматики, з тренування, з будь-якої картки без списку під нею):
//               «назад» повертає на екран, звідки тапнули (у тренуванні — на те саме слово).
//   replace   — картка слова, під якою СПИСОК (словник/пошук), і ціль у ТОМУ САМОМУ списку
//               (видова пара в одному класі): стек не росте, «назад» → той самий список.
//   rebuild   — картка під списком, ціль в ІНШОМУ списку (інша частина мови або інша підкатегорія,
//               напр. létat (V клас) ↔ letět (IV клас)): хвіст стека від меню частин мови
//               перебудовується в канонічний ланцюжок цілі [parent → BrowseList → BrowseCard]
//               (одна атомарна дія reset). Глибина стека не росте, зациклень немає, а екрани джерела
//               (картка і список слова, з якого тапнули) знімаються зі стека.
//
// Картка, відкрита НЕ зі списку (з тренування чи граматики), завжди робить replace: «назад» тоді
// повертає в тренування/граматику, а не в проміжні списки.

export type LinkMode = "push" | "replace";
export type LinkAction = "push" | "replace" | "rebuild";

export interface NavStateLike {
  index: number;
  routes: { name: string; params?: any }[];
}

export function resolveLinkAction(
  requested: LinkMode,
  state: NavStateLike | undefined,
  target: { id: string; entryIds: string[] }
): LinkAction {
  if (requested === "push") return "push";
  const current = state?.routes?.[state.index];
  // replace має сенс лише на екрані BrowseCard; будь-де інде — безпечний push.
  if (!state || current?.name !== "BrowseCard") return "push";
  const beneath = state.routes[state.index - 1];
  if (beneath?.name !== "BrowseList") return "replace"; // відкрито з тренування/граматики
  const currentIds: string[] | undefined = current.params?.entryIds;
  return currentIds && currentIds.includes(target.id) ? "replace" : "rebuild";
}

// Меню частин мови — корінь будь-якого ланцюжка «меню → розділ → список → картка».
const MENU_SCREEN: keyof RootStackParamList = "WordsPartOfSpeech";

export function openLinkedWord(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  mode: LinkMode,
  wordId: string,
  kind: BrowseKind
): void {
  const entry = findSearchEntry(wordId, kind);
  if (!entry) return; // wordId не знайдено в словнику — тихо ігноруємо тап
  const initialIndex = Math.max(0, entry.entryIds.indexOf(entry.id));
  const params = { kind: entry.kind, entryIds: entry.entryIds, initialIndex, title: entry.title };
  const listParams = { kind: entry.kind, entryIds: entry.entryIds, title: entry.title };
  const state = typeof navigation.getState === "function" ? (navigation.getState() as NavStateLike) : undefined;
  const action = resolveLinkAction(mode, state, entry);

  if (action === "rebuild") {
    // Канонічний хвіст цілі від меню частин мови: [parent → BrowseList → BrowseCard].
    const menuIdx = state ? lastIndexBelow(state.routes, state.index - 1, MENU_SCREEN) : -1;
    if (state && menuIdx >= 0 && typeof navigation.dispatch === "function") {
      navigation.dispatch((s: any) => {
        const routes = s.routes as any[];
        const base = routes.slice(0, menuIdx + 1);
        const keepParent = routes[menuIdx + 1]?.name === entry.parentScreen; // той самий хаб — лишаємо екран (скрол/стан)
        const tail = [
          keepParent ? routes[menuIdx + 1] : { name: entry.parentScreen },
          { name: "BrowseList", params: listParams },
          { name: "BrowseCard", params },
        ];
        const next = [...base, ...tail];
        return CommonActions.reset({ ...s, routes: next, index: next.length - 1 });
      });
      return;
    }
    // Нетипова форма стека (меню не знайдено) — старий безпечний 3-кроковий push.
    navigation.push(entry.parentScreen);
    navigation.push("BrowseList", listParams);
    navigation.push("BrowseCard", params);
  } else if (action === "replace") {
    navigation.replace("BrowseCard", params);
  } else {
    navigation.push("BrowseCard", params);
  }
}

// Індекс найближчого ЗНИЗУ (≤ from) екрана з даним ім'ям; -1, якщо немає.
function lastIndexBelow(routes: { name: string }[], from: number, name: string): number {
  for (let i = Math.min(from, routes.length - 1); i >= 0; i--) if (routes[i].name === name) return i;
  return -1;
}
