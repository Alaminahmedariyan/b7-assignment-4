import { z } from "zod";
import { ItemRentalStatus } from "../../../../generated/prisma/enums";

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

const updateRentalStatusValidationSchema = z.object({
  status: z.enum([
    ItemRentalStatus.READY_FOR_PICKUP,
    ItemRentalStatus.PICKED_UP,
    ItemRentalStatus.RETURNED,
  ]),
});

export const rentalValidation = {
  createRentalValidationSchema,
  cancelRentalValidationSchema,
  updateRentalStatusValidationSchema,
};