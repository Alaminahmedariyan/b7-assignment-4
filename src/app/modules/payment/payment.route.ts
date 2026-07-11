import { Router } from "express";
import express from "express";

import { Role } from "../../../../generated/prisma/enums";

import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";

import { paymentController } from "./payment.controller";

import { createPaymentValidationSchema, confirmPaymentValidationSchema } from "./payment.validation";

const router = Router();

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

router.post("/create", auth(Role.CUSTOMER), validateRequest(createPaymentValidationSchema), paymentController.createPaymentIntent);

router.post("/confirm", auth(Role.CUSTOMER), validateRequest(confirmPaymentValidationSchema), paymentController.confirmPayment);

router.get("/", auth(Role.CUSTOMER), paymentController.getMyPayments);

router.get("/:id", auth(Role.CUSTOMER), paymentController.getSinglePayment);

/*
|--------------------------------------------------------------------------
| Stripe Webhook
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook
);

export const paymentRoutes = router;
