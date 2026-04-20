const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { hashPassword } = require('../src/services/passwordService');
const { signAccessToken } = require('../src/services/tokenService');

let app;
function getApp() {
  if (!app) app = createApp();
  return app;
}

async function createUser({ email = 'test@b.com', password = 'password123', role = 'user', plan = 'free' } = {}) {
  const passwordHash = await hashPassword(password);
  return User.create({ email, passwordHash, role, plan });
}

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

module.exports = { getApp, request, createUser, authHeader };
