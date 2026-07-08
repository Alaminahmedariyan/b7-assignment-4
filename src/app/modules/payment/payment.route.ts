import { Router } from "express";


import { Role } from "../../../../generated/prisma/enums";

import { paymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { createPaymentValidationSchema } from "./payment.validaion";


const router = Router();

router.post(
  "/create-intent",
  auth(Role.CUSTOMER),
  validateRequest(createPaymentValidationSchema),
  paymentController.createPaymentIntent
);

export const paymentRoutes = router;