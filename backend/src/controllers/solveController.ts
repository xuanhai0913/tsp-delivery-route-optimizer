import type { RequestHandler } from "express";

import { solveTsp, type SolverAlgorithm } from "../services/solverService.js";
import type { SolveRequest } from "../types/tsp.js";
import { validateSolveRequest } from "../validators/solveRequestValidator.js";

function createSolveHandler(algorithm: SolverAlgorithm): RequestHandler {
  return (request, response) => {
    const issues = validateSolveRequest(request.body);

    if (issues.length > 0) {
      response.status(400).json({
        error: "Invalid solve request.",
        issues
      });
      return;
    }

    response.json(solveTsp(algorithm, request.body as SolveRequest));
  };
}

export const solveGreedy = createSolveHandler("greedy");
export const solveBranchAndBound = createSolveHandler("branch-and-bound");
