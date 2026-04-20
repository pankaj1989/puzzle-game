const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');

registerHooks();

describe('User model', () => {
  it('creates a user with required fields', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    expect(user.email).toBe('a@b.com');
    expect(user.role).toBe('user');
    expect(user.plan).toBe('free');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('enforces unique email', async () => {
    await User.create({ email: 'a@b.com', passwordHash: 'x' });
    await expect(
      User.create({ email: 'a@b.com', passwordHash: 'y' })
    ).rejects.toThrow();
  });

  it('lowercases email on save', async () => {
    const user = await User.create({ email: 'MiXeD@B.Com', passwordHash: 'x' });
    expect(user.email).toBe('mixed@b.com');
  });
});
