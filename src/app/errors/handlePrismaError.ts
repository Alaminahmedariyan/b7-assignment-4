import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";

type TPrismaError = {
  statusCode: number;
  message: string;
  errorCode?: string;
};

export const handlePrismaError = (
  error: unknown
): TPrismaError | null => {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Invalid request data.",
      errorCode: "PRISMA_VALIDATION_ERROR",
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return {
          statusCode: StatusCodes.CONFLICT,
          message: "Resource already exists.",
          errorCode: error.code,
        };

      case "P2003":
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: "Foreign key constraint failed.",
          errorCode: error.code,
        };

      case "P2025":
        return {
          statusCode: StatusCodes.NOT_FOUND,
          message: "Resource not found.",
          errorCode: error.code,
        };

      default:
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: "Database request failed.",
          errorCode: error.code,
        };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const prismaError = error as Prisma.PrismaClientInitializationError;

    return {
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      message: "Database connection failed.",
      errorCode: prismaError.errorCode ?? "PRISMA_INIT_ERROR",
    };
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Database query failed.",
      errorCode: "PRISMA_UNKNOWN_ERROR",
    };
  }

  return null;
};