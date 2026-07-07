import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { authService } from "./auth.service";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  // Access Token Cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: config.app.env === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 Day
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.app.env === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Days
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Login successful",
    data: result,
  });
});

export const authController = {
  loginUser,
};