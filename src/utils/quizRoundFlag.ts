// Прапорець «щойно завершено раунд» поза системою навігації.
// Використовується замість передачі параметра через navigation.navigate(),
// щоб уникнути неоднозначної поведінки (зациклення) при змішуванні
// "navigate заради params" з системним "назад"/свайпом.
//
// Квіз ставить прапорець і робить чистий goBack(); екран категорій
// зчитує (і одразу скидає) прапорець у useFocusEffect.

let justFinished = false;

export function markRoundFinished(): void {
  justFinished = true;
}

export function consumeRoundFinished(): boolean {
  const v = justFinished;
  justFinished = false;
  return v;
}
