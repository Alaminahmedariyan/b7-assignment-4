import { z } from "zod";

const loginValidationSchema = z.object({
  email: z
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const authValidation = {
  loginValidationSchema,
};