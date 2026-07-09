import { StatusCodes } from "http-status-codes";

import { dashboardService } from "./dashboard.service";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getAdminDashboard = catchAsync(async (req, res) => {
  const result =
    await dashboardService.getAdminDashboardIntoDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Dashboard fetched successfully.",
    data: result,
  });
});

const getProviderDashboard = catchAsync(
  async (req, res) => {
    const result =
      await dashboardService.getProviderDashboardIntoDB(
        req.user!.id
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Dashboard fetched successfully.",
      data: result,
    });
  }
);

const getCustomerDashboard = catchAsync(
  async (req, res) => {
    const result =
      await dashboardService.getCustomerDashboardIntoDB(
        req.user!.id
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Dashboard fetched successfully.",
      data: result,
    });
  }
);

export const dashboardController = {
  getAdminDashboard,
  getProviderDashboard,
  getCustomerDashboard,
};