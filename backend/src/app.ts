import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { healthRouter } from "./routes/healthRoutes.js";
import { solveRouter } from "./routes/solveRoutes.js";

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length
    ? configuredOrigins
    : ["http://localhost:5173", "https://maps.hailamdev.space"];
}

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || getAllowedOrigins().includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      }
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/api/solve", solveRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
