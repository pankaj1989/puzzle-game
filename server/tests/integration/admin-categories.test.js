const { registerHooks } = require('../testSetup');
const { getApp, request, admin, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');

registerHooks();
const app = () => getApp();

describe('admin categories', () => {
  it('PATCH updates name and regenerates slug', async () => {
    const cat = await Category.create({
      name: 'Food',
      image: 'categories/food.png',
      isPremium: false,
    });
    const res = await request(app())
      .patch(`/admin/categories/${cat._id}`)
      .set(authHeader(await admin()))
      .send({ name: 'Food & Drink' });
    expect(res.status).toBe(200);
    expect(res.body.category.slug).toBe('food-drink');

    const fresh = await Category.findById(cat._id);
    expect(fresh.slug).toBe('food-drink');
    expect(fresh.name).toBe('Food & Drink');
  });

  it('PATCH without image keeps existing image path', async () => {
    const cat = await Category.create({
      name: 'Movies',
      image: 'categories/movies.png',
      isPremium: true,
    });
    const res = await request(app())
      .patch(`/admin/categories/${cat._id}`)
      .set(authHeader(await admin()))
      .send({ isPremium: false });
    expect(res.status).toBe(200);

    const fresh = await Category.findById(cat._id);
    expect(fresh.image).toBe('categories/movies.png');
    expect(fresh.isPremium).toBe(false);
    expect(fresh.slug).toBe('movies');
  });

  it('assigns suffixed slug on collision', async () => {
    await Category.create({
      name: 'Foo Bar',
      image: 'categories/a.png',
      isPremium: false,
    });
    const second = await Category.create({
      name: 'Foo-Bar',
      image: 'categories/b.png',
      isPremium: false,
    });
    expect(second.slug).toBe('foo-bar-2');
  });
});
