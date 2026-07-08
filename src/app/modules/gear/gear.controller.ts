import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { gearService } from "./gear.service";

const createGear = catchAsync(async (req: Request, res: Response) => {
if (
  req.body.specifications &&
  typeof req.body.specifications === "string"
) {
  req.body.specifications = JSON.parse(req.body.specifications);
}
  const providerId = req.user!.id;

  const result = await gearService.createGearIntoDB(providerId, req.body, req.files as Express.Multer.File[]);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Gear created successfully.",
    data: result,
  });
});

const getAllGears = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.getAllGearsFromDB(req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gears retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleGear = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.getSingleGearFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gear retrieved successfully.",
    data: result,
  });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.updateGearIntoDB(req.user!.id, req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gear updated successfully.",
    data: result,
  });
});

const deleteGear = catchAsync(async (req: Request, res: Response) => {
  await gearService.deleteGearFromDB(req.user!.id, req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gear deleted successfully.",
    data: null,
  });
});

const checkAvailability = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await gearService.checkGearAvailabilityFromDB(
        req.params.id as string,
        req.query.startDate as string,
        req.query.endDate as string
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Availability checked successfully.",
      data: result,
    });
  }
);

export const gearController = {
  createGear,
  getAllGears,
  getSingleGear,
  updateGear,
  deleteGear,
  checkAvailability
};
