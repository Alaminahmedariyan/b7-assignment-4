import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { categoryRoutes } from "../modules/category/category.route";
import { gearRoutes } from "../modules/gear/gear.route";
import { rentalRoutes } from "../modules/rental/rental.route";
import { dashboardRoutes } from "../modules/dashboard/dashboard.route";
import { reviewRoutes } from "../modules/review/review.route";
import { paymentRoutes } from "../modules/payment/payment.route";

const router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
  {
    path: "/gears",
    route: gearRoutes,
  },
  {
    path: "/rentals",
    route: rentalRoutes,
  },
  {
    path: "/dashboard",
    route: dashboardRoutes,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  }
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export const globalRoutes = router;
