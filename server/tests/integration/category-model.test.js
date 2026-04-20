const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');

registerHooks();

describe('Category model', () => {
  it('creates with required fields and defaults', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    expect(cat.slug).toBe('movies');
    expect(cat.name).toBe('Movies');
    expect(cat.isPremium).toBe(false);
    expect(cat.icon).toBeNull();
  });

  it('enforces unique slug', async () => {
    await Category.create({ slug: 'movies', name: 'Movies' });
    await expect(
      Category.create({ slug: 'movies', name: 'Cinema' })
    ).rejects.toThrow();
  });

  it('lowercases and trims slug', async () => {
    const cat = await Category.create({ slug: '  MUSIC  ', name: 'Music' });
    expect(cat.slug).toBe('music');
  });
});
