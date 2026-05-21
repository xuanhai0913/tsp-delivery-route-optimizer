import type { RequestHandler } from "express";

import {
  solveShortestPath,
  SolverNotImplementedError,
  type SolverAlgorithm
} from "../services/solverService.js";
import type { PathSolveRequest } from "../types/path.js";
import { validateSolveRequest } from "../validators/solveRequestValidator.js";

function createSolveHandler(algorithm: SolverAlgorithm): RequestHandler {
  return (request, response, next) => {
    const issues = validateSolveRequest(request.body);

    if (issues.length > 0) {
      response.status(400).json({
        error: "Invalid shortest-path solve request.",
        issues
      });
      return;
    }

    try {
      response.json(solveShortestPath(algorithm, request.body as PathSolveRequest));
    } catch (error) {
      if (error instanceof SolverNotImplementedError) {
        response.status(501).json({
          error: "Shortest-path solver is not implemented yet.",
          algorithm: error.algorithm
        });
        return;
      }

      next(error);
    }
  };
}

export const solveDijkstra = createSolveHandler("dijkstra");
export const solveAStar = createSolveHandler("a-star");
