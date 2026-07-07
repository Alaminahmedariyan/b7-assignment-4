import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
const router = Router();

router.post(
  "/register",
  validateRequest(userValidation.registerUserValidationSchema),
  userController.registerUser
);
router.get(
  "/me",
  auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),
  userController.getMyProfile
);
router.patch(
  "/me",
  auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),
  validateRequest(userValidation.updateProfileValidationSchema),
  userController.updateMyProfile
);
router.patch(
  "/change-password",
  auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),
  validateRequest(userValidation.changePasswordValidationSchema),
  userController.changePassword
);

export const userRoutes = router;
