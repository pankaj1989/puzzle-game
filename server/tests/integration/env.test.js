describe('env loader', () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.resetModules();
  });

  it('returns parsed env with correct types', () => {
    const env = require('../../src/config/env');
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
    expect(env.JWT_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('throws when a required var is missing', () => {
    delete process.env.JWT_ACCESS_SECRET;
    jest.resetModules();
    expect(() => require('../../src/config/env')).toThrow(/JWT_ACCESS_SECRET/);
  });
});
