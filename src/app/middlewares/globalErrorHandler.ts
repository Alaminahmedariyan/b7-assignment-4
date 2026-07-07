import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";


import { handlePrismaError } from "../errors/handlePrismaError";
import AppError from "../errors/appError";

export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorCode: string | undefined;
  let details: unknown;

  // Custom App Error
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    details = error.details;
  }

  // Prisma Error
  else {
    const prismaError = handlePrismaError(error);

    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errorCode = prismaError.errorCode;
    } else {
      message = error.message || message;
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorCode,
    details,
    stack:
      process.env.NODE_ENV === "development"
        ? error.stack
        : undefined,
  });
};