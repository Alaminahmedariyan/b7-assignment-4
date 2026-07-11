import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";

import config from "./app/config";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { globalRoutes } from "./app/routes";

const app: Application = express();

// CORS
app.use(
  cors({
    origin: config.app.clientUrl,
    credentials: true,
  })
);


// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "GearUp Rental API is running.",
  });
});

// API Routes
app.use("/api/v1", globalRoutes);

// 404 Route
app.use(notFound);

// Global Error Handler (Always Last)
app.use(globalErrorHandler);

export default app;