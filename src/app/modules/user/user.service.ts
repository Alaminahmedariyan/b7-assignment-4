import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import { RegisterUserPayload } from "./user.interface";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/appError";

const registerUserIntoDB = async (payload: RegisterUserPayload) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    nidUrl,
  } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "User already exists with this email."
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt.saltRounds)
  );

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

export const userService = {
  registerUserIntoDB,
};