import type { PathSolveRequest, PathSolveResult } from "../types/path.js";
import { solveDijkstra } from "../algorithms/dijkstra/dijkstra.js";

export type SolverAlgorithm = "dijkstra" | "a-star";

export class SolverNotImplementedError extends Error {
  constructor(public readonly algorithm: SolverAlgorithm) {
    super(`${algorithm} solver is not implemented yet.`);
  }
}

export function solveShortestPath(algorithm: SolverAlgorithm, request: PathSolveRequest): PathSolveResult {
  if (algorithm === "dijkstra") {
    return solveDijkstra(request);
  }

  throw new SolverNotImplementedError(algorithm);
}
