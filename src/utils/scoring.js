// Payout rules:
// Picker wins:  picker +$5,  other player -$5
// Picker loses: picker -$10, other player +$10
// CFP games double all amounts

export function calcGameResult(game, result) {
  if (!result) return { billDelta: 0, donDelta: 0, settled: false };
  const mult = game.isCFP ? 2 : 1;
  if (result === 'push') return { billDelta: 0, donDelta: 0, settled: true };

  const billIsPicker = game.billPicker;

  let billDelta, donDelta;
  if (billIsPicker) {
    if (result === 'bill') {
      // Bill (picker) wins
      billDelta =  5 * mult;
      donDelta  = -5 * mult;
    } else {
      // Bill (picker) loses
      billDelta = -10 * mult;
      donDelta  =  10 * mult;
    }
  } else {
    // Don is picker
    if (result === 'don') {
      // Don (picker) wins
      billDelta = -5 * mult;
      donDelta  =  5 * mult;
    } else {
      // Don (picker) loses
      billDelta =  10 * mult;
      donDelta  = -10 * mult;
    }
  }

  return { billDelta, donDelta, settled: true };
}

export function calcTotals(games, results) {
  let billTotal = 0, donTotal = 0;
  let billWins = 0, billLosses = 0;
  let donWins  = 0, donLosses  = 0;
  let billPickWins = 0, billPickLosses = 0;
  let donPickWins  = 0, donPickLosses  = 0;

  games.forEach(game => {
    const result = results[game.id];
    if (!result) return;
    const { billDelta, donDelta } = calcGameResult(game, result);
    billTotal += billDelta;
    donTotal  += donDelta;
    if (billDelta > 0) billWins++; else if (billDelta < 0) billLosses++;
    if (donDelta  > 0) donWins++;  else if (donDelta  < 0) donLosses++;
    // Picker record — did the picker's team cover?
    if (game.billPicker) {
      if (result === 'bill') billPickWins++; else billPickLosses++;
    } else {
      if (result === 'don') donPickWins++; else donPickLosses++;
    }
  });

  return {
    billTotal, donTotal,
    billRecord:     `${billWins}-${billLosses}`,
    donRecord:      `${donWins}-${donLosses}`,
    billPickRecord: `${billPickWins}-${billPickLosses}`,
    donPickRecord:  `${donPickWins}-${donPickLosses}`,
  };
}

export function formatMoney(n) {
  if (n === 0) return '$0';
  return (n > 0 ? '+' : '-') + '$' + Math.abs(n);
}

export function moneyClass(n) {
  if (n > 0) return 'pos';
  if (n < 0) return 'neg';
  return 'zero';
}
