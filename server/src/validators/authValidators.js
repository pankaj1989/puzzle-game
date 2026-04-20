const { z } = require('zod');

const email = z.email().max(254).transform((s) => s.toLowerCase().trim());
const password = z.string().min(8).max(128);

const signupSchema = z.object({
  email,
  password,
  displayName: z.string().min(1).max(60).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const magicLinkRequestSchema = z.object({ email });
const magicLinkVerifySchema = z.object({ token: z.string().min(1) });

const googleSchema = z.object({ idToken: z.string().min(1) });

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  googleSchema,
};
