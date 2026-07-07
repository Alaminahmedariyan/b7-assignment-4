import { z } from "zod";

const createGearValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Gear name must be at least 2 characters.")
    .max(150, "Gear name cannot exceed 150 characters."),

  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can contain only lowercase letters, numbers and hyphens."
    ),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters."),

  brand: z.string().trim().optional(),

  pricePerDay: z.coerce
    .number()
    .positive("Price must be greater than zero."),

  totalQuantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1."),

  specifications: z.any().optional(),

  categoryId: z
    .string()
    .trim()
    .min(1, "Category is required."),
});

const updateGearValidationSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),

  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  description: z
    .string()
    .trim()
    .min(10)
    .optional(),

  brand: z.string().trim().optional(),

  pricePerDay: z.number().positive().optional(),

  totalQuantity: z.number().int().min(1).optional(),

  specifications: z.record(z.string(), z.any()).optional(),

  categoryId: z.string().optional(),

  isListed: z.boolean().optional(),
});

export const gearValidation = {
  createGearValidationSchema,
  updateGearValidationSchema,
};