const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { signAccessToken } = require('../src/services/tokenService');

let app;

function getApp() {
  if (!app) app = createApp();
  return app;
}

async function createUser(overrides = {}) {
  return User.create({
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    passwordHash: 'hash',
    role: 'user',
    plan: 'free',
    ...overrides,
  });
}

async function admin() {
  return createUser({ email: 'admin@test.com', role: 'admin' });
}

function authHeader(user) {
  const token = signAccessToken(user);
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  getApp,
  request,
  createUser,
  admin,
  authHeader,
};
