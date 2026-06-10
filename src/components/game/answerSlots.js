/** Build ordered slots (char + space gaps) from server word lengths. */
export function buildAnswerSlots(wordLengths) {
  if (!wordLengths?.length) return [];
  const slots = [];
  let answerIndex = 0;
  wordLengths.forEach((len, wordIdx) => {
    for (let i = 0; i < len; i += 1) {
      slots.push({ type: 'char', index: answerIndex });
      answerIndex += 1;
    }
    if (wordIdx < wordLengths.length - 1) {
      slots.push({ type: 'space', index: answerIndex });
      answerIndex += 1;
    }
  });
  return slots;
}

export function cellsToGuess(cells, wordLengths) {
  return buildAnswerSlots(wordLengths)
    .map((slot) => {
      if (slot.type === 'space') return ' ';
      return (cells[slot.index] || '').toLowerCase();
    })
    .join('');
}

export function initCells(wordLengths) {
  const slots = buildAnswerSlots(wordLengths);
  const length = slots.length ? slots[slots.length - 1].index + 1 : 0;
  const cells = Array.from({ length }, () => '');
  slots.forEach((slot) => {
    if (slot.type === 'space') cells[slot.index] = ' ';
  });
  return cells;
}

export function clearUnrevealedCells(cells, revealed, wordLengths) {
  const next = [...cells];
  buildAnswerSlots(wordLengths).forEach((slot) => {
    if (slot.type === 'space') {
      next[slot.index] = ' ';
    } else if (revealed[slot.index] === undefined) {
      next[slot.index] = '';
    }
  });
  return next;
}
