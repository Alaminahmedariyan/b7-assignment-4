import { Router } from "express";

import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";

import { gearController } from "./gear.controller";
import { gearValidation } from "./gear.validation";
import { Role } from "../../../../generated/prisma/enums";
import { upload } from "../../middlewares/multer";

const router = Router();

router.get("/", gearController.getAllGears);
router.get("/:id/availability", gearController.checkAvailability);
router.get("/:id", gearController.getSingleGear);
router.post( "/", auth(Role.PROVIDER), upload.array("images", 10),
 validateRequest(gearValidation.createGearValidationSchema),  gearController.createGear);
router.patch("/:id", auth(Role.PROVIDER), validateRequest(gearValidation.updateGearValidationSchema), gearController.updateGear);
router.delete("/:id", auth(Role.PROVIDER), gearController.deleteGear);

export const gearRoutes = router;