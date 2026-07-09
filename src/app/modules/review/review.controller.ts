import { StatusCodes } from "http-status-codes";

import { reviewService } from "./review.service";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReviewIntoDB(
    req.user!.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Review submitted successfully.",
    data: result,
  });
});

const getGearReviews = catchAsync(async (req, res) => {
  const result =
    await reviewService.getGearReviewsFromDB(
      req.params.gearId as string
    );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Reviews retrieved successfully.",
    data: result,
  });
});

export const reviewController = {
  createReview,
  getGearReviews,
};