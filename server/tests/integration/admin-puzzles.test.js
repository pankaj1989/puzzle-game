const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const mongoose = require('mongoose');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

async function seed() {
  return Category.create({ slug: 'movies', name: 'Movies' });
}

describe('admin puzzles CRUD', () => {
  it('POST /admin/puzzles creates', async () => {
    const cat = await seed();
    const res = await request(app()).post('/admin/puzzles').set(authHeader(await admin())).send({
      plate: 'LUV2MRO', answer: 'love tomorrow', categoryId: cat._id.toString(),
      difficulty: 'easy', clue: 'feeling', revealSequence: [0, 1, 2],
    });
    expect(res.status).toBe(201);
    expect(res.body.puzzle.plate).toBe('LUV2MRO');
    expect(res.body.puzzle.answer).toBe('love tomorrow');
  });

  it('POST validates revealSequence', async () => {
    const cat = await seed();
    const res = await request(app()).post('/admin/puzzles').set(authHeader(await admin())).send({
      plate: 'X', answer: 'x', categoryId: cat._id.toString(),
      difficulty: 'easy', clue: 'x', revealSequence: [],
    });
    expect(res.status).toBe(400);
  });

  it('GET /admin/puzzles returns paginated list with answers', async () => {
    const cat = await seed();
    for (let i = 0; i < 3; i++) {
      await Puzzle.create({
        plate: `P${i}`, answer: `a${i}`, categoryId: cat._id, difficulty: 'easy',
        clue: 'x', revealSequence: [0],
      });
    }
    const res = await request(app()).get('/admin/puzzles').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.puzzles).toHaveLength(3);
    expect(res.body.puzzles[0].answer).toBeDefined();
  });

  it('GET filters by categorySlug', async () => {
    const movies = await seed();
    const music = await Category.create({ slug: 'music', name: 'Music' });
    await Puzzle.create({ plate: 'P1', answer: 'a', categoryId: movies._id, difficulty: 'easy', clue: 'x', revealSequence: [0] });
    await Puzzle.create({ plate: 'P2', answer: 'b', categoryId: music._id, difficulty: 'easy', clue: 'x', revealSequence: [0] });
    const res = await request(app()).get('/admin/puzzles?categorySlug=music').set(authHeader(await admin()));
    expect(res.body.total).toBe(1);
    expect(res.body.puzzles[0].plate).toBe('P2');
  });

  it('GET /admin/puzzles/:id returns one with answer', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'LUV2MRO', answer: 'love tomorrow', categoryId: cat._id,
      difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).get(`/admin/puzzles/${p._id}`).set(authHeader(await admin()));
    expect(res.body.puzzle.answer).toBe('love tomorrow');
  });

  it('PATCH /admin/puzzles/:id updates fields', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'A', answer: 'a', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).patch(`/admin/puzzles/${p._id}`).set(authHeader(await admin()))
      .send({ difficulty: 'hard', clue: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.puzzle.difficulty).toBe('hard');
    expect(res.body.puzzle.clue).toBe('updated');
  });

  it('DELETE removes puzzle', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'A', answer: 'a', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).delete(`/admin/puzzles/${p._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(204);
    expect(await Puzzle.findById(p._id)).toBeNull();
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'user@test.com' });
    const res = await request(app()).get('/admin/puzzles').set(authHeader(user));
    expect(res.status).toBe(403);
  });

  it('404 on unknown id', async () => {
    const fake = new mongoose.Types.ObjectId();
    const res = await request(app()).get(`/admin/puzzles/${fake}`).set(authHeader(await admin()));
    expect(res.status).toBe(404);
  });
});
