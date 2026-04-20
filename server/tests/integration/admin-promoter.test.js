const { registerHooks } = require('../testSetup');
const { promoteIfAdminEmail } = require('../../src/services/adminPromoter');
const User = require('../../src/models/User');

registerHooks();

describe('promoteIfAdminEmail', () => {
  it('promotes user whose email is in ADMIN_EMAILS', async () => {
    const user = await User.create({ email: 'admin@test.com', passwordHash: 'x', role: 'user' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('admin');
  });

  it('leaves non-admin emails untouched', async () => {
    const user = await User.create({ email: 'regular@test.com', passwordHash: 'x', role: 'user' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('user');
  });

  it('idempotent when user already admin', async () => {
    const user = await User.create({ email: 'admin@test.com', passwordHash: 'x', role: 'admin' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('admin');
  });
});
