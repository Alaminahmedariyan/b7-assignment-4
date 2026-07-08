import { StatusCodes } from "http-status-codes";


import AppError from "../../errors/appError";


import { stripe } from "./payment.stripe";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";

const createPaymentIntentIntoDB = async (
  customerId: string,
  rentalOrderId: string
) => {const rental = await prisma.rentalOrder.findFirst({
  where: {
    id: rentalOrderId,
    customerId,
  },

  include: {
    payments: true,
  },
});

if (!rental) {
  throw new AppError(
    StatusCodes.NOT_FOUND,
    "Rental not found."
  );
}if (rental.status === "CANCELLED") {
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Cancelled rental cannot be paid."
  );
}const payment = rental.payments[0];

if (!payment) {
  throw new AppError(
    StatusCodes.NOT_FOUND,
    "Payment record not found."
  );
}if (payment.status === "COMPLETED") {
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Payment already completed."
  );
}const amount = Math.round(
  Number(rental.totalAmount) * 100
);

const paymentIntent =
  await stripe.paymentIntents.create({
    amount,

    currency: "bdt",

    automatic_payment_methods: {
      enabled: true,
    },
  });
  await prisma.payment.update({
  where: {
    id: payment.id,
  },

  data: {
    gatewayResponse: {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    } as Prisma.JsonObject,
  },
});return {
  clientSecret: paymentIntent.client_secret,
  paymentIntentId: paymentIntent.id,
};
};export const paymentService = {
  createPaymentIntentIntoDB,
};