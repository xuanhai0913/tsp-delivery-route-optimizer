import type { PathSolveRequest, PathSolveResult } from "../types/path.js";
import { solveAStar } from "../algorithms/a-star/aStar.js";
import { solveDijkstra } from "../algorithms/dijkstra/dijkstra.js";
import { solveFloydWarshall } from "../algorithms/floyd-warshall/floydWarshall.js";
import { solveBellmanFord } from "../algorithms/bellman-ford/bellmanFord.js";

export type SolverAlgorithm = "dijkstra" | "a-star" | "floyd-warshall" | "bellman-ford";

export function solveShortestPath(algorithm: SolverAlgorithm, request: PathSolveRequest): PathSolveResult {
  if (algorithm === "dijkstra") {
    return solveDijkstra(request);
  }

  if (algorithm === "a-star") {
    return solveAStar(request);
  }

  if (algorithm === "floyd-warshall") {
    return solveFloydWarshall(request);
  }

  if (algorithm === "bellman-ford") {
    return solveBellmanFord(request);
  }

  throw new Error(`Unsupported solver algorithm: ${algorithm satisfies never}`);
}
