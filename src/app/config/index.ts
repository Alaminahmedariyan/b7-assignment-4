import dotenv from "dotenv";
import path from "path";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/appError";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;

  if (!value) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Missing required environment variable: ${key}`, "ENV_VALIDATION_ERROR");
  }

  return value;
};

const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Environment variable "${key}" must be a valid number.`, "ENV_VALIDATION_ERROR");
  }

  return parsedValue;
};

const config = {
  app: {
    env: getEnv("NODE_ENV", "development"),
    port: getNumberEnv("PORT", 5000),
    clientUrl: getEnv("CLIENT_URL"),
  },

  database: {
    url: getEnv("DATABASE_URL"),
  },

  bcrypt: {
    saltRounds: getNumberEnv("BCRYPT_SALT_ROUNDS", 10),
  },

  jwt: {
    secret: getEnv("JWT_ACCESS_SECRET"),
    refreshSecret: getEnv("JWT_REFRESH_SECRET"),
    expiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", "1d"),
    refreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },

  stripe: {
    productId: getEnv("STRIPE_PRODUCT_ID"),
    secretKey: getEnv("STRIPE_SECRET_KEY"),
    webhookSecret: getEnv("STRIPE_WEBHOOK_SECRET"),
  },
} as const;

export default config;
