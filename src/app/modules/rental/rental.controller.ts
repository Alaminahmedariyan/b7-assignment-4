import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { rentalService } from "./rental.service";

const createRental = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await rentalService.createRentalIntoDB(
        req.user!.id,
        req.body
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Rental order created successfully.",
      data: result,
    });
  }
);

export const rentalController = {
  createRental,
};