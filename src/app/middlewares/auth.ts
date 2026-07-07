import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/appError";
import { catchAsync } from "../utils/catchAsync";
import { Role } from "../../../generated/prisma/enums";
import { jwtUtils } from "../../lib/jwt";
import { prisma } from "../../lib/prisma";

export const auth = (...requiredRoles: Role[]) =>
  catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      let token: string | undefined;

      // Access Token from Cookie
      if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      // Access Token from Authorization Header
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "You are not authorized."
        );
      }

      const decoded = jwtUtils.verifyToken(
        token,
        config.jwt.secret
      ) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (!user) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "User not found."
        );
      }

      if (user.deletedAt) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "This account has been deleted."
        );
      }

      if (user.status === "SUSPENDED") {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "Your account has been suspended."
        );
      }

      if (
        requiredRoles.length &&
        !requiredRoles.includes(user.role)
      ) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not allowed to access this resource."
        );
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    }
  );