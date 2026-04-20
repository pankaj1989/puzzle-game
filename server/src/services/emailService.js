const sgMail = require('@sendgrid/mail');
const env = require('../config/env');

if (env.NODE_ENV !== 'test') {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function sendEmail({ to, subject, html, text }) {
  if (env.NODE_ENV === 'test') {
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
