import { z } from "zod";

export const createPaymentValidationSchema = z.object({
  rentalOrderId: z.string({
    error: "Rental order id is required.",
  }),
});

export const confirmPaymentValidationSchema = z.object({
  paymentIntentId: z.string({
    error: "Payment Intent Id is required.",
  }),
});