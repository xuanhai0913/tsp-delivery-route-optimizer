import { Router } from "express";

import { solveAStar, solveDijkstra, solveFloydWarshall, solveBellmanFord } from "../controllers/solveController.js";

export const solveRouter = Router();

solveRouter.post("/dijkstra", solveDijkstra);
solveRouter.post("/a-star", solveAStar);
solveRouter.post("/floyd-warshall", solveFloydWarshall);
solveRouter.post("/bellman-ford", solveBellmanFord);