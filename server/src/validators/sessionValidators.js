const { z } = require('zod');

const startSessionSchema = z.object({
  categorySlug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/).optional(),
}).strict();

const guessSchema = z.object({
  guess: z.string().min(1).max(200),
}).strict();

const mongoIdSchema = z.string().regex(/^[a-f0-9]{24}$/);

const listSessionsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

module.exports = { startSessionSchema, guessSchema, mongoIdSchema, listSessionsQuery };
