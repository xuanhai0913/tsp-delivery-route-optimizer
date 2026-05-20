import { Router } from "express";

import { solveBranchAndBound, solveGreedy } from "../controllers/solveController.js";

export const solveRouter = Router();

solveRouter.post("/greedy", solveGreedy);
solveRouter.post("/branch-and-bound", solveBranchAndBound);
