import { z } from "zod";

const createGearValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(150),

  description: z
    .string()
    .trim()
    .min(10),

  brand: z.string().trim().optional(),

  pricePerDay: z.coerce
    .number()
    .positive(),

  totalQuantity: z.coerce
    .number()
    .int()
    .min(1),

  specifications: z.any().optional(),

  categoryId: z.string().trim(),
});

const updateGearValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  description: z
    .string()
    .trim()
    .min(10)
    .optional(),

  brand: z.string().trim().optional(),

  pricePerDay: z.coerce
    .number()
    .positive()
    .optional(),

  totalQuantity: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

  specifications: z.any().optional(),

  categoryId: z.string().optional(),

  isListed: z.boolean().optional(),
});

export const gearValidation = {
  createGearValidationSchema,
  updateGearValidationSchema,
};