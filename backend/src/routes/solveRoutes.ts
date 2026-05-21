import { Router } from "express";

import { solveAStar, solveDijkstra } from "../controllers/solveController.js";

export const solveRouter = Router();

solveRouter.post("/dijkstra", solveDijkstra);
solveRouter.post("/a-star", solveAStar);
