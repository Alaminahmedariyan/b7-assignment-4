import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import AppError from "../../errors/appError";


import { LoginUserPayload } from "./auth.interface";
import { prisma } from "../../../lib/prisma";
import { jwtUtils } from "../../../lib/jwt";

const loginUser = async (payload: LoginUserPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "User not found."
    );
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Your account has been suspended."
    );
  }

  if (!user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please login with Google."
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password."
    );
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

const accessToken = jwtUtils.createToken(
  jwtPayload,
  config.jwt.secret,
  config.jwt.expiresIn as SignOptions["expiresIn"]
);

const refreshToken = jwtUtils.createToken(
  jwtPayload,
  config.jwt.refreshSecret,
  config.jwt.refreshExpiresIn as SignOptions["expiresIn"]
);

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Refresh token is missing."
    );
  }

  const verifiedToken = jwtUtils.verifyToken(
    token,
    config.jwt.refreshSecret
  );

  if (!verifiedToken.success) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid refresh token."
    );
  }

  const { id } = verifiedToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "User not found."
    );
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Your account has been suspended."
    );
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt.secret,
    config.jwt.expiresIn as SignOptions["expiresIn"]
  );

  return {
    accessToken,
  };
};

export const authService = {
  loginUser,
  refreshToken,
};