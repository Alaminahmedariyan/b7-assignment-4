import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
const router = Router();

router.post(
  "/register",
  validateRequest(userValidation.registerUserValidationSchema),
  userController.registerUser
);

export const userRoutes = router;
