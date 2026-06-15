const { slugifyName } = require('../../src/services/categorySlugService');

describe('categorySlugService', () => {
  it('slugifyName normalizes text', () => {
    expect(slugifyName('Food & Drink')).toBe('food-drink');
    expect(slugifyName('  Hello World!  ')).toBe('hello-world');
  });
});
