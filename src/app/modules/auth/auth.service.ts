import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";


import config from "../../config";


import { LoginUserPayload } from "./auth.interface";
import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/appError";
import { jwtUtils } from "../../../lib/jwt";

const loginUser = async (payload: LoginUserPayload) => {
  const { email, password } = payload;

  // Find user
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

  // OAuth account check
  if (!user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please login using Google."
    );
  }

  // Account status check
  if (user.status === "SUSPENDED") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Your account has been suspended."
    );
  }

  if (user.status === "VERIFICATION_PENDING") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Your account is not verified yet."
    );
  }

  // Password check
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

  // JWT Payload
  const jwtPayload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Access Token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt.secret,
    config.jwt.expiresIn as SignOptions["expiresIn"]
  );

  // Refresh Token
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

export const authService = {
  loginUser,
};