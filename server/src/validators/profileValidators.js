const { z } = require('zod');

const updateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(60).optional(),
  })
  .strict();

module.exports = { updateProfileSchema };
