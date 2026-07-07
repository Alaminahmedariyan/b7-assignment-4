import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import { RegisterUserPayload, UpdateProfilePayload } from "./user.interface";
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
export const userService = {
  registerUserIntoDB,
  getMyProfileFromDB,
  updateMyProfileIntoDB,
};
