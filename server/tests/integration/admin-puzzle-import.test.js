const { registerHooks } = require('../testSetup');
const { getApp, request, admin, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');

registerHooks();
const app = () => getApp();

describe('admin puzzle import', () => {
  it('imports puzzles from CSV and upserts by plate', async () => {
    await Category.create({
      name: 'Movies',
      image: 'categories/movies.png',
      isPremium: false,
    });

    const csv = [
      'plate,answer,category,difficulty,clue,basePoints,timeLimitSeconds,isPremium',
      'IMPRT1,import one,Movies,easy,First import row,100,60,false',
      'IMPRT2,import two,Movies,medium,Second import row,120,90,true',
    ].join('\n');

    const adminUser = await admin();
    const res = await request(app())
      .post('/admin/puzzles/import')
      .set(authHeader(adminUser))
      .attach('file', Buffer.from(csv), 'puzzles.csv');

    expect(res.status).toBe(200);
    expect(res.body.summary.created).toBe(2);
    expect(res.body.summary.failed).toBe(0);

    const count = await Puzzle.countDocuments({ plate: { $in: ['IMPRT1', 'IMPRT2'] } });
    expect(count).toBe(2);

    const csvUpdate = [
      'plate,answer,category,difficulty,clue',
      'IMPRT1,import one updated,Movies,hard,Updated clue',
    ].join('\n');

    const updateRes = await request(app())
      .post('/admin/puzzles/import')
      .set(authHeader(adminUser))
      .attach('file', Buffer.from(csvUpdate), 'puzzles.csv');

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.summary.updated).toBe(1);

    const puzzle = await Puzzle.findOne({ plate: 'IMPRT1' });
    expect(puzzle.difficulty).toBe('hard');
    expect(puzzle.answer).toBe('import one updated');
  });

  it('reports row errors for invalid data', async () => {
    await Category.create({
      name: 'Music',
      image: 'categories/music.png',
      isPremium: false,
    });

    const csv = [
      'plate,answer,category,difficulty,clue',
      ',missing plate,Music,easy,Bad row',
      'BAD1,valid answer,Unknown Category,easy,Bad category',
      'BAD2,valid answer,Music,invalid,Bad difficulty',
    ].join('\n');

    const res = await request(app())
      .post('/admin/puzzles/import')
      .set(authHeader(await admin()))
      .attach('file', Buffer.from(csv), 'bad.csv');

    expect(res.status).toBe(200);
    expect(res.body.summary.failed).toBe(3);
    expect(res.body.summary.errors.length).toBe(3);
  });
});
