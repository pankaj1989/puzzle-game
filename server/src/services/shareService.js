function buildShareText({ plate, score, hintsUsed, wrongGuesses }) {
  const solved = score > 0;
  const wrongRow = '⬜'.repeat(Math.max(0, wrongGuesses));
  const solvedRow = solved ? '🟩🟩🟩🟩🟩' : '';
  const outcomeLine = solved ? `${wrongRow}${solvedRow}` : (wrongRow || '⬜');
  return [
    'Bumper Stumpers',
    `Plate: ${plate}`,
    outcomeLine,
    `Hints: ${hintsUsed} · Wrong: ${wrongGuesses} · Score: ${score}`,
  ].join('\n');
}

module.exports = { buildShareText };
