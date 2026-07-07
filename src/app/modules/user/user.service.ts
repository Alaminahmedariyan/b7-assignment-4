import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import { ChangePasswordPayload, RegisterUserPayload, UpdateProfilePayload } from "./user.interface";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/appError";

const registerUserIntoDB = async (payload: RegisterUserPayload) => {
  const { name, email, password, phone, address, nidUrl } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist) {
    throw new AppError(StatusCodes.CONFLICT, "User already exists with this email.");
  }

  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt.saltRounds));

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      nidUrl,
    },

    omit: {
      password: true,
    },
  });

  return createdUser;
};

const getMyProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return user;
};

const updateMyProfileIntoDB = async (
  userId: string,
  payload: UpdateProfilePayload
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "User not found."
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
    omit: {
      password: true,
    },
  });

  return updatedUser;
};

const changePasswordIntoDB = async (
  userId: string,
  payload: ChangePasswordPayload
) => {
  const { oldPassword, newPassword } = payload;

  // Prevent using the same password
  if (oldPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from the old password."
    );
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "User not found."
    );
  }

  // OAuth user can't change password
  if (!user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Password change is not available for this account."
    );
  }

  // Verify old password
  const isOldPasswordMatched = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!isOldPasswordMatched) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Old password is incorrect."
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    config.bcrypt.saltRounds
  );

  // Update password
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return null;
};
export const userService = {
  registerUserIntoDB,
  getMyProfileFromDB,
  updateMyProfileIntoDB,
  changePasswordIntoDB,
};
