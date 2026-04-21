const { buildShareText } = require('../../src/services/shareService');

describe('buildShareText', () => {
  it('produces a short block with plate, score, hints, wrong guesses', () => {
    const text = buildShareText({
      plate: 'STRW4R', score: 145, hintsUsed: 1, wrongGuesses: 2,
    });
    expect(text).toContain('Bumper Stumpers');
    expect(text).toContain('STRW4R');
    expect(text).toContain('145');
    expect(text).toContain('🟩');
  });

  it('uses different grid for unsolved (score=0)', () => {
    const text = buildShareText({
      plate: 'X', score: 0, hintsUsed: 0, wrongGuesses: 3,
    });
    expect(text).toContain('⬜');
    expect(text).not.toContain('🟩');
  });
});
