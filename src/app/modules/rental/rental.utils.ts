import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";

export const calculateRentalDays = (
  startDate: Date,
  endDate: Date
) => {
  const diff = endDate.getTime() - startDate.getTime();

  const days =
    Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

  if (days <= 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "End date must be after start date."
    );
  }

  return days;
};

export const generateOrderNumber = () => {
  return `GR-${Date.now()}`;
};

export const generateTransactionId = () => {
  return `PAY-${Date.now()}`;
};