const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('GET /leaderboards/:window', () => {
  beforeEach(async () => {
    await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A', totalScore: 200 });
    await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B', totalScore: 100 });
  });

  it('returns all-time entries', async () => {
    const res = await request(app()).get('/leaderboards/all');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0].displayName).toBe('A');
  });

  it('returns day entries (empty when no sessions)', async () => {
    const res = await request(app()).get('/leaderboards/day');
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
  });

  it('rejects unknown window with 400', async () => {
    const res = await request(app()).get('/leaderboards/bogus');
    expect(res.status).toBe(400);
  });
});

describe('GET /leaderboards/me', () => {
  it('401 without token', async () => {
    const res = await request(app()).get('/leaderboards/me');
    expect(res.status).toBe(401);
  });

  it('returns rank + score for authed user', async () => {
    const user = await createUser({ email: 'me@x.com' });
    user.totalScore = 150;
    await user.save();
    await User.create({ email: 'a@x.com', passwordHash: 'x', totalScore: 200 });
    const res = await request(app()).get('/leaderboards/me?window=all').set(authHeader(user));
    expect(res.body).toEqual({ rank: 2, score: 150, window: 'all' });
  });

  it('defaults window to all when absent', async () => {
    const user = await createUser({ email: 'me@x.com' });
    user.totalScore = 50;
    await user.save();
    const res = await request(app()).get('/leaderboards/me').set(authHeader(user));
    expect(res.body.window).toBe('all');
  });
});
