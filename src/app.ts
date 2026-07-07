import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./app/config";
import { globalRoutes } from "./app/routes";

const app: Application = express();

app.use(
  cors({
    origin: config.app.clientUrl,
    credentials: true,
  }),
);

// const endpointSecret = config.stripe_webhook_secret;

// app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.use("/api/v1", globalRoutes);

export default app;
