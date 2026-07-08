import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";

import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";

import { rentalController } from "./rental.controller";
import { rentalValidation } from "./rental.validation";


const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(
    rentalValidation.createRentalValidationSchema
  ),
  rentalController.createRental
);

export const rentalRoutes = router;