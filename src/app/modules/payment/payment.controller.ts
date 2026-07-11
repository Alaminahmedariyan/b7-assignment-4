import { StatusCodes } from "http-status-codes";

import { paymentService } from "./payment.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createPaymentIntent = catchAsync(async (req, res) => {
  const result =
    await paymentService.createPaymentIntentIntoDB(
      req.user!.id,
      req.body.rentalOrderId
    );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment intent created successfully.",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req, res) => {
  const result =
    await paymentService.confirmPaymentIntoDB(
      req.body.paymentIntentId
    );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment confirmed successfully.",
    data: result,
  });
});

const stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers[
    "stripe-signature"
  ] as string;

  const result =
    await paymentService.handleStripeWebhookIntoDB(
      signature,
      req.body
    );

  res.status(StatusCodes.OK).json(result);
});

const getMyPayments = catchAsync(async (req, res) => {
  const result =
    await paymentService.getMyPaymentsFromDB(
      req.user!.id
    );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payments retrieved successfully.",
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req, res) => {
  const result =
    await paymentService.getSinglePaymentFromDB(
      req.user!.id,
      req.params.id as string
    );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment retrieved successfully.",
    data: result,
  });
});
export const paymentController = {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getMyPayments,
  getSinglePayment
};