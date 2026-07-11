import { z } from "zod";

const createCategoryValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  parentId: z
    .string()
    .trim()
    .nullish(),
});

const updateCategoryValidationSchema =
  createCategoryValidationSchema.partial();

export const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};