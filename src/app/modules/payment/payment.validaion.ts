import { z } from "zod";

export const createPaymentValidationSchema = z.object({
  body: z.object({
    rentalOrderId: z.string({
      error: "Rental order id is required.",
    }),
  }),
});