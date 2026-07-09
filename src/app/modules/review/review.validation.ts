import { z } from "zod";

const createReviewValidationSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),

  comment: z
    .string()
    .trim()
    .min(5)
    .max(500)
    .optional(),

  rentalOrderItemId: z.string().min(1),
});

export const reviewValidation = {
  createReviewValidationSchema,
};