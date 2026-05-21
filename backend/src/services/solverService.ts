import type { PathSolveRequest, PathSolveResult } from "../types/path.js";

export type SolverAlgorithm = "dijkstra" | "a-star";

export class SolverNotImplementedError extends Error {
  constructor(public readonly algorithm: SolverAlgorithm) {
    super(`${algorithm} solver is not implemented yet.`);
  }
}

export function solveShortestPath(algorithm: SolverAlgorithm, _request: PathSolveRequest): PathSolveResult {
  throw new SolverNotImplementedError(algorithm);
}
