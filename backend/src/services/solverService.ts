import type { PathSolveRequest, PathSolveResult } from "../types/path.js";
import { solveAStar } from "../algorithms/a-star/aStar.js";
import { solveDijkstra } from "../algorithms/dijkstra/dijkstra.js";

export type SolverAlgorithm = "dijkstra" | "a-star";

export function solveShortestPath(algorithm: SolverAlgorithm, request: PathSolveRequest): PathSolveResult {
  if (algorithm === "dijkstra") {
    return solveDijkstra(request);
  }

  if (algorithm === "a-star") {
    return solveAStar(request);
  }

  throw new Error(`Unsupported solver algorithm: ${algorithm satisfies never}`);
}
