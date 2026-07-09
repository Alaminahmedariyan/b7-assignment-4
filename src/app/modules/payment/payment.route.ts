import { Router } from "express";

import { Role } from "../../../../generated/prisma/enums";

import { paymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createPaymentValidationSchema,
  confirmPaymentValidationSchema,
} from "./payment.validation";

const router = Router();

router.post(
  "/create-intent",
  auth(Role.CUSTOMER),
  validateRequest(createPaymentValidationSchema),
  paymentController.createPaymentIntent
);

router.post(
  "/confirm",
  auth(Role.CUSTOMER),
  validateRequest(confirmPaymentValidationSchema),
  paymentController.confirmPayment
);

router.post(
  "/webhook",
  paymentController.stripeWebhook
);

export const paymentRoutes = router;