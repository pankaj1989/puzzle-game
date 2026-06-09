const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  isPremium: z.boolean().optional(),
}).strict();

const updateCategorySchema = z.object({
  name: z.string().min(1).max(60).optional(),
  isPremium: z.boolean().optional(),
}).strict();

module.exports = { createCategorySchema, updateCategorySchema };
