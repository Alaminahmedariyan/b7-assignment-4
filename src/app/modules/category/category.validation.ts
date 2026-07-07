import { z } from "zod";

const createCategoryValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name cannot exceed 100 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can contain only lowercase letters, numbers and hyphens."
    ),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  parentId: z
    .string()
    .trim()
    .optional(),
});

const updateCategoryValidationSchema = createCategoryValidationSchema.partial();

export const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};