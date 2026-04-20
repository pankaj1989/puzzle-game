const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const Category = require('../../src/models/Category');

registerHooks();
const app = () => getApp();

describe('GET /categories', () => {
  beforeEach(async () => {
    await Category.create({ slug: 'movies', name: 'Movies', isPremium: false });
    await Category.create({ slug: 'music', name: 'Music', isPremium: true });
  });

  it('returns all categories sorted by name', async () => {
    const res = await request(app()).get('/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
    expect(res.body.categories[0].slug).toBe('movies'); // 'Movies' < 'Music'
    expect(res.body.categories[1].slug).toBe('music');
    expect(res.body.categories[0]).toMatchObject({
      slug: 'movies', name: 'Movies', isPremium: false,
    });
  });
});
