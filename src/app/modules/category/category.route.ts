import { Router } from "express";


import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";

import { categoryController } from "./category.controller";
import { categoryValidation } from "./category.validation";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory
);

export const categoryRoutes = router;