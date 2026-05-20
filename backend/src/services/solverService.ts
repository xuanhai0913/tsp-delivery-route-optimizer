import { solveBranchAndBound } from "../algorithms/branch-and-bound/branchAndBound.js";
import { solveGreedyNearestNeighbor } from "../algorithms/greedy/greedy.js";
import type { SolveRequest, SolveResult } from "../types/tsp.js";

export type SolverAlgorithm = "greedy" | "branch-and-bound";

export function solveTsp(algorithm: SolverAlgorithm, request: SolveRequest): SolveResult {
  if (algorithm === "greedy") {
    return solveGreedyNearestNeighbor(request);
  }

  return solveBranchAndBound(request);
}
