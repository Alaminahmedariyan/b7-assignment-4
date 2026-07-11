import { z } from "zod";
import { ItemRentalStatus } from "../../../../generated/prisma/enums";

const rentalItemSchema = z.object({
  gearItemId: z.string().min(1, "Gear item is required."),

  quantity: z.coerce
    .number()
    .int()
    .positive(),

  startDate: z.string().min(1, "Start date is required."),

  endDate: z.string().min(1, "End date is required."),
});

const createRentalValidationSchema = z.object({
  items: z.array(rentalItemSchema).min(1),
});

const cancelRentalValidationSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(5)
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