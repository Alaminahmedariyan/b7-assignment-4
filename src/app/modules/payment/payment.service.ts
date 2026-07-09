import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";

import { stripe } from "./payment.stripe";
import { prisma } from "../../../lib/prisma";
import { OrderStatus, PaymentStatus, Prisma } from "../../../../generated/prisma/client";
import Stripe from "stripe";
import config from "../../config";

const createPaymentIntentIntoDB = async (customerId: string, rentalOrderId: string) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalOrderId,
      customerId,
    },

    include: {
      payments: true,
    },
  });

  if (!rental) {
    throw new AppError(StatusCodes.NOT_FOUND, "Rental not found.");
  }
if (rental.status === OrderStatus.CANCELLED) {
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Cancelled rental cannot be paid."
  );
}
  const payment = rental.payments[0];

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found.");
  }
if (payment.status === PaymentStatus.COMPLETED) {
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Payment already completed."
  );
}
  const amount = Math.round(Number(rental.totalAmount) * 100);

const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: "bdt",

  automatic_payment_methods: {
    enabled: true,
    allow_redirects: "never",
  },

  metadata: {
    rentalOrderId,
    customerId,
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
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

const handleStripeWebhookIntoDB = async (
  signature: string,
  payload: Buffer
) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
  } catch (error) {

  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Invalid webhook signature."
  );
}
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;
      const rentalOrderId =
        paymentIntent.metadata.rentalOrderId;

      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: {
            rentalOrderId,
          },

          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),

            gatewayResponse: JSON.parse(
              JSON.stringify(paymentIntent)
            ),
          },
        });

        await tx.rentalOrder.update({
          where: {
            id: rentalOrderId,
          },

          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: OrderStatus.PLACED,
          },
        });
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      const rentalOrderId =
        paymentIntent.metadata.rentalOrderId;

      await prisma.payment.updateMany({
        where: {
          rentalOrderId,
        },

        data: {
          status: PaymentStatus.FAILED,

          gatewayResponse: JSON.parse(
            JSON.stringify(paymentIntent)
          ),
        },
      });

      break;
    }

    default:
      break;
  }

  return {
    received: true,
  };
};

const confirmPaymentIntoDB = async (
  paymentIntentId: string
) => {
  if (config.app.env === "production") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "This endpoint is disabled in production."
    );
  }

  const paymentIntent =
    await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: "pm_card_visa",
      }
    );

  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
  };
};

export const paymentService = {
  createPaymentIntentIntoDB,
  handleStripeWebhookIntoDB,
  confirmPaymentIntoDB,
};
