const { z } = require('zod');

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().max(100).optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  plan: z.enum(['free', 'premium']).optional(),
}).strict();

module.exports = { listQuery, updateUserSchema };
