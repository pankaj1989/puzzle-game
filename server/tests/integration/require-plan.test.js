const express = require('express');
const request = require('supertest');
const { registerHooks } = require('../testSetup');
const { createUser, authHeader } = require('../helpers');
const authRequired = require('../../src/middleware/authRequired');
const requirePlan = require('../../src/middleware/requirePlan');
const { errorHandler } = require('../../src/middleware/errorHandler');

registerHooks();

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/premium', authRequired(), requirePlan('premium'), (req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('requirePlan middleware', () => {
  it('allows a premium user through the gate', async () => {
    const app = buildApp();
    const user = await createUser({ email: 'prem@b.com', plan: 'premium' });
    const res = await request(app).get('/premium').set(authHeader(user));
    expect(res.status).toBe(200);
  });

  it('blocks a free user with 403 PLAN_REQUIRED', async () => {
    const app = buildApp();
    const user = await createUser({ email: 'free@b.com', plan: 'free' });
    const res = await request(app).get('/premium').set(authHeader(user));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
  });
});
