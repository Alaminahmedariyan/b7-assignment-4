import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"]
): string => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

const verifyToken = (
  token: string,
  secret: string
): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtUtils = {
  createToken,
  verifyToken,
};