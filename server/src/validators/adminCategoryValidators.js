const { z } = require('zod');

const slugSchema = z.string().min(1).max(40).regex(/^[a-z0-9-]+$/);

const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(60),
  icon: z.string().max(200).optional(),
  isPremium: z.boolean().optional(),
}).strict();

const updateCategorySchema = z.object({
  name: z.string().min(1).max(60).optional(),
  icon: z.string().max(200).nullable().optional(),
  isPremium: z.boolean().optional(),
}).strict();

module.exports = { createCategorySchema, updateCategorySchema };
