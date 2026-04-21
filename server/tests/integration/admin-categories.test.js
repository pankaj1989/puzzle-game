const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');

registerHooks();
const app = () => getApp();

async function admin() {
  return createUser({ email: 'admin@test.com', role: 'admin' });
}

describe('admin categories CRUD', () => {
  it('GET /admin/categories lists all (admin)', async () => {
    await Category.create({ slug: 'movies', name: 'Movies' });
    await Category.create({ slug: 'music', name: 'Music', isPremium: true });
    const res = await request(app()).get('/admin/categories').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
  });

  it('POST /admin/categories creates', async () => {
    const res = await request(app()).post('/admin/categories').set(authHeader(await admin()))
      .send({ slug: 'music', name: 'Music', isPremium: true });
    expect(res.status).toBe(201);
    expect(res.body.category.slug).toBe('music');
  });

  it('POST rejects duplicate slug with 409', async () => {
    await Category.create({ slug: 'music', name: 'Music' });
    const res = await request(app()).post('/admin/categories').set(authHeader(await admin()))
      .send({ slug: 'music', name: 'Another' });
    expect(res.status).toBe(409);
  });

  it('PATCH /admin/categories/:id updates name', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    const res = await request(app()).patch(`/admin/categories/${cat._id}`).set(authHeader(await admin()))
      .send({ name: 'Cinema' });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe('Cinema');
  });

  it('DELETE /admin/categories/:id deletes empty category', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    const res = await request(app()).delete(`/admin/categories/${cat._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(204);
    expect(await Category.findById(cat._id)).toBeNull();
  });

  it('DELETE returns 409 when category has puzzles', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    await Puzzle.create({
      plate: 'X', answer: 'x', categoryId: cat._id, difficulty: 'easy',
      clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).delete(`/admin/categories/${cat._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_HAS_PUZZLES');
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'user@test.com' });
    const res = await request(app()).get('/admin/categories').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
