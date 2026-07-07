import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

import config from "../config";
import AppError from "../errors/appError";
import { handlePrismaError } from "../errors/handlePrismaError";
import { handleZodError } from "../errors/handleZodError";

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorCode: string | undefined;
  let details: unknown;

  // App Error
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    details = error.details;
  }

  // Zod Error
  else if (error instanceof ZodError) {
    const zodError = handleZodError(error);

    statusCode = zodError.statusCode;
    message = zodError.message;
    details = zodError.details;
  }

  // Prisma Error
  else {
    const prismaError = handlePrismaError(error);

    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errorCode = prismaError.errorCode;
    }

    // Other Errors
    else if (error instanceof Error) {
      message = error.message;
    }
  }

  const response: Record<string, unknown> = {
    success: false,
    statusCode,
    message,
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (details) {
    response.details = details;
  }

  if (config.app.env === "development") {
    response.stack = error instanceof Error ? error.stack : undefined;
  }

  res.status(statusCode).json(response);
};