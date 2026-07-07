import { z } from "zod";

const registerUserValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .email("Invalid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  phone: z.string().optional(),

  address: z.string().optional(),

  nidUrl: z.string().url("Invalid NID URL").optional(),
});
const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),

    phone: z.string().trim().optional(),

    address: z.string().trim().optional(),

    nidUrl: z.string().trim().optional(),
  }),
});

export const userValidation = {
  registerUserValidationSchema,
    updateProfileValidationSchema,
};