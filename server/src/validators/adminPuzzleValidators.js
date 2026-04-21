const { z } = require('zod');

const mongoId = z.string().regex(/^[a-f0-9]{24}$/);

const createPuzzleSchema = z.object({
  plate: z.string().min(1).max(20),
  answer: z.string().min(1).max(200),
  categoryId: mongoId,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  clue: z.string().min(1).max(500),
  revealSequence: z.array(z.number().int().min(0)).min(1),
  basePoints: z.number().int().min(0).optional(),
  timeLimitSeconds: z.number().int().min(5).optional(),
  isPremium: z.boolean().optional(),
}).strict();

const updatePuzzleSchema = createPuzzleSchema.partial().strict();

const listPuzzlesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categorySlug: z.string().max(40).optional(),
});

module.exports = { createPuzzleSchema, updatePuzzleSchema, listPuzzlesQuery, mongoId };
