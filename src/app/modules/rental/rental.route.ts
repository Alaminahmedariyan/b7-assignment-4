import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";

import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";

import { rentalController } from "./rental.controller";
import { rentalValidation } from "./rental.validation";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(rentalValidation.createRentalValidationSchema), rentalController.createRental);

router.get("/my-rentals", auth(Role.CUSTOMER), rentalController.getMyRentals);
router.get("/provider/rentals", auth(Role.PROVIDER), rentalController.getProviderRentals);
router.get("/provider/rentals/:id", auth(Role.PROVIDER), rentalController.getProviderSingleRental);
router.get("/:id", auth(Role.CUSTOMER), rentalController.getSingleRental);

router.patch(
  "/:id/cancel",
  auth(Role.CUSTOMER),
  validateRequest(rentalValidation.cancelRentalValidationSchema),
  rentalController.cancelRental,
);

router.patch(
  "/provider/rentals/:id/status",
  auth(Role.PROVIDER),
  validateRequest(rentalValidation.updateRentalStatusValidationSchema),
  rentalController.updateRentalStatus,
);
export const rentalRoutes = router;
