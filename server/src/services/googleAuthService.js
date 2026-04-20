const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function verifyIdToken(idToken) {
  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) throw new Error('Invalid Google token');
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    displayName: payload.name || null,
  };
}

module.exports = { verifyIdToken };
