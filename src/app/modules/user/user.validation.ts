import { z } from "zod";

const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),

    email: z
      .email("Invalid email address")
      .trim()
      .toLowerCase(),

    password: z.string().min(6),

    phone: z.string().optional(),

    address: z.string().optional(),

    nidUrl: z.string().optional(),
  }),
});

export const userValidation = {
  registerUserValidationSchema,
};