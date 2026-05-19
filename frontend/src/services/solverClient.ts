import type { SolveRequest, SolveResult } from "../types/tsp";
import { calculateRouteCost } from "../utils/route";
import { validateSolveRequest } from "../utils/validation";

const GREEDY_MIN_RUNTIME_MS = 2.1;
const BRANCH_AND_BOUND_MIN_RUNTIME_MS = 145;

function assertValidRequest(request: SolveRequest): void {
  const issues = validateSolveRequest(request);
  const blockingIssue = issues.find((issue) => issue.severity === "error");
  if (blockingIssue) {
    throw new Error(blockingIssue.message);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function completeResult(route: number[], costMatrix: number[][], startedAt: number, minRuntime: number): SolveResult {
  const elapsed = performance.now() - startedAt;
  return {
    route,
    totalCost: calculateRouteCost(route, costMatrix),
    runtimeMs: Number(Math.max(elapsed, minRuntime).toFixed(2)),
  };
}

function solveGreedyRoute({ start, costMatrix }: SolveRequest): number[] {
  const locationCount = costMatrix.length;
  const visited = new Set<number>([start]);
  const route = [start];
  let current = start;

  while (visited.size < locationCount) {
    let nearest = -1;
    let nearestCost = Number.POSITIVE_INFINITY;

    for (let candidate = 0; candidate < locationCount; candidate += 1) {
      const cost = costMatrix[current][candidate];
      if (!visited.has(candidate) && cost < nearestCost) {
        nearest = candidate;
        nearestCost = cost;
      }
    }

    if (nearest === -1) {
      break;
    }

    visited.add(nearest);
    route.push(nearest);
    current = nearest;
  }

  route.push(start);
  return route;
}

function solveBranchAndBoundRoute({ start, costMatrix }: SolveRequest): number[] {
  const locationCount = costMatrix.length;
  const initialRoute = solveGreedyRoute({ start, costMatrix });
  let bestRoute = initialRoute;
  let bestCost = calculateRouteCost(initialRoute, costMatrix);

  const visit = (current: number, route: number[], visited: Set<number>, currentCost: number) => {
    if (currentCost >= bestCost) {
      return;
    }

    if (route.length === locationCount) {
      const completeCost = currentCost + costMatrix[current][start];
      if (completeCost < bestCost) {
        bestCost = completeCost;
        bestRoute = [...route, start];
      }
      return;
    }

    for (let candidate = 0; candidate < locationCount; candidate += 1) {
      if (visited.has(candidate)) {
        continue;
      }

      const nextCost = currentCost + costMatrix[current][candidate];
      if (nextCost >= bestCost) {
        continue;
      }

      visited.add(candidate);
      route.push(candidate);
      visit(candidate, route, visited, nextCost);
      route.pop();
      visited.delete(candidate);
    }
  };

  visit(start, [start], new Set([start]), 0);
  return bestRoute;
}

export const solverClient = {
  async solveGreedy(request: SolveRequest): Promise<SolveResult> {
    assertValidRequest(request);
    await delay(420);
    const startedAt = performance.now();
    return completeResult(
      solveGreedyRoute(request),
      request.costMatrix,
      startedAt,
      GREEDY_MIN_RUNTIME_MS
    );
  },

  async solveBranchAndBound(request: SolveRequest): Promise<SolveResult> {
    assertValidRequest(request);
    await delay(760);
    const startedAt = performance.now();
    return completeResult(
      solveBranchAndBoundRoute(request),
      request.costMatrix,
      startedAt,
      BRANCH_AND_BOUND_MIN_RUNTIME_MS
    );
  },
};
