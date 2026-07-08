import { z } from "zod";

const rentalItemSchema = z.object({
  gearItemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createRentalValidationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  items: z.array(rentalItemSchema).min(1),
});

export const cancelRentalValidationSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(5, "Cancellation reason is required.")
    .max(500),
});

export const rentalValidation = {
  createRentalValidationSchema,
  cancelRentalValidationSchema,
};