import { Router } from "express";

import { pingDatabase } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    service: "routelab-backend",
    uptimeSec: Number(process.uptime().toFixed(2))
  });
});

healthRouter.get("/db", async (_request, response, next) => {
  try {
    const database = await pingDatabase();

    response.status(database.configured ? 200 : 503).json({
      status: database.configured ? "ok" : "not-configured",
      database
    });
  } catch (error) {
    next(error);
  }
});
