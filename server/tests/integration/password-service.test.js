const { hashPassword, verifyPassword } = require('../../src/services/passwordService');

describe('passwordService', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('exports a DUMMY_HASH suitable for bcrypt.compare', async () => {
    const { DUMMY_HASH, verifyPassword } = require('../../src/services/passwordService');
    expect(typeof DUMMY_HASH).toBe('string');
    expect(DUMMY_HASH.startsWith('$2')).toBe(true);
    // Comparing against it should return false for any plausible input
    expect(await verifyPassword('anything', DUMMY_HASH)).toBe(false);
  });
});
