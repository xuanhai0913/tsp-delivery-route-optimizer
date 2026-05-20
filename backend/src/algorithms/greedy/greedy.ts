import { performance } from "node:perf_hooks";

import type { SolveRequest, SolveResult } from "../../types/tsp.js";
import { calculateRouteCost } from "../../utils/route.js";

export function solveGreedyNearestNeighbor({ start, costMatrix }: SolveRequest): SolveResult {
  const startedAt = performance.now();
  const visited = new Set<number>([start]);
  const route = [start];
  let current = start;

  while (visited.size < costMatrix.length) {
    let nextLocation = -1;
    let nextCost = Number.POSITIVE_INFINITY;

    for (let candidate = 0; candidate < costMatrix.length; candidate += 1) {
      const cost = costMatrix[current]?.[candidate] ?? Number.POSITIVE_INFINITY;

      if (!visited.has(candidate) && cost < nextCost) {
        nextLocation = candidate;
        nextCost = cost;
      }
    }

    if (nextLocation === -1) {
      break;
    }

    visited.add(nextLocation);
    route.push(nextLocation);
    current = nextLocation;
  }

  route.push(start);

  return {
    route,
    totalCost: calculateRouteCost(route, costMatrix),
    runtimeMs: Number((performance.now() - startedAt).toFixed(3))
  };
}
