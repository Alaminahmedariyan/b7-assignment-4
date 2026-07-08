import { StatusCodes } from "http-status-codes";



import { paymentService } from "./payment.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createPaymentIntent = catchAsync(async (req, res) => {
  const result = await paymentService.createPaymentIntentIntoDB(

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

export const paymentController = {
  createPaymentIntent,
};