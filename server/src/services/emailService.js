const sgMail = require('@sendgrid/mail');
const env = require('../config/env');

function isRealKey(key) {
  return typeof key === 'string' && key.startsWith('SG.') && !key.includes('placeholder') && key.length > 20;
}

const USE_REAL_SENDGRID = env.NODE_ENV === 'production' || (env.NODE_ENV === 'development' && isRealKey(env.SENDGRID_API_KEY));

if (USE_REAL_SENDGRID) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function sendEmail({ to, subject, html, text }) {
  if (!USE_REAL_SENDGRID) {
    return { mocked: true };
  }
  return sgMail.send({
    to,
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
    subject,
    html,
    text,
  });
}

async function sendMagicLink(email, link) {
  return sendEmail({
    to: email,
    subject: 'Your Bumper Stumpers sign-in link',
    html: `<p>Click to sign in: <a href="${link}">${link}</a></p><p>This link expires in ${env.MAGIC_LINK_TTL_MINUTES} minutes.</p>`,
    text: `Sign in: ${link}\nExpires in ${env.MAGIC_LINK_TTL_MINUTES} minutes.`,
  });
}

module.exports = { sendEmail, sendMagicLink };
