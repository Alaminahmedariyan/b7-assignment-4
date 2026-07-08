import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { rentalService } from "./rental.service";
import { ProviderRentalQuery, RentalQuery } from "./rental.interface";

const createRental = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.createRentalIntoDB(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Rental order created successfully.",
    data: result,
  });
});

const getMyRentals = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.getMyRentalsFromDB(req.user!.id, req.query as RentalQuery);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Rentals retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleRental = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.getSingleRentalFromDB(req.user!.id, req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Rental retrieved successfully.",
    data: result,
  });
});

const cancelRental = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.cancelRentalIntoDB(req.user!.id, req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Rental cancelled successfully.",
    data: result,
  });
});

const getProviderRentals = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.getProviderRentalsFromDB(req.user!.id, req.query as ProviderRentalQuery);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Provider rentals retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getProviderSingleRental = catchAsync(async (req: Request, res: Response) => {
  const result = await rentalService.getProviderSingleRentalFromDB(req.user!.id, req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Provider rental retrieved successfully.",
    data: result,
  });
});

const updateRentalStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await rentalService.updateRentalStatusIntoDB(
        req.user!.id,
        req.params.id as string,
        req.body
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Rental status updated successfully.",
      data: result,
    });
  }
);
export const rentalController = {
  createRental,
  getMyRentals,
  getSingleRental,
  cancelRental,
  getProviderRentals,
  getProviderSingleRental,
  updateRentalStatus
};
