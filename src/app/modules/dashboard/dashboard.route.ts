import { Router } from "express";

import { Role } from "../../../../generated/prisma/enums";

import { auth } from "../../middlewares/auth";

import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get(
  "/admin",
  auth(Role.ADMIN),
  dashboardController.getAdminDashboard
);

router.get(
  "/provider",
  auth(Role.PROVIDER),
  dashboardController.getProviderDashboard
);

router.get(
  "/customer",
  auth(Role.CUSTOMER),
  dashboardController.getCustomerDashboard
);

export const dashboardRoutes = router;