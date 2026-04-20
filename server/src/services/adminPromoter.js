const env = require('../config/env');

async function promoteIfAdminEmail(user) {
  if (!user?.email) return;
  const list = env.ADMIN_EMAILS; // already an array via zod transform
  if (!list.includes(user.email.toLowerCase())) return;
  if (user.role === 'admin') return;
  user.role = 'admin';
  await user.save();
}

module.exports = { promoteIfAdminEmail };
