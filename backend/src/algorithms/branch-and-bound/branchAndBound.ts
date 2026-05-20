import { performance } from "node:perf_hooks";

import type { SolveRequest, SolveResult } from "../../types/tsp.js";
import { solveGreedyNearestNeighbor } from "../greedy/greedy.js";

function getMinOutgoingCosts(costMatrix: number[][]): number[] {
  return costMatrix.map((row, rowIndex) => {
    let minCost = Number.POSITIVE_INFINITY;

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (columnIndex !== rowIndex && row[columnIndex] < minCost) {
        minCost = row[columnIndex];
      }
    }

    return minCost;
  });
}

function calculateLowerBound(
  current: number,
  start: number,
  visited: Set<number>,
  currentCost: number,
  costMatrix: number[][],
  minOutgoingCosts: number[]
): number {
  let bound = currentCost;

  if (visited.size === costMatrix.length) {
    return bound + costMatrix[current][start];
  }

  let currentExitMin = Number.POSITIVE_INFINITY;
  for (let candidate = 0; candidate < costMatrix.length; candidate += 1) {
    if (!visited.has(candidate) && costMatrix[current][candidate] < currentExitMin) {
      currentExitMin = costMatrix[current][candidate];
    }
  }

  bound += currentExitMin;

  for (let location = 0; location < costMatrix.length; location += 1) {
    if (!visited.has(location)) {
      bound += minOutgoingCosts[location];
    }
  }

  return bound;
}

export function solveBranchAndBound({ start, costMatrix }: SolveRequest): SolveResult {
  const startedAt = performance.now();
  const greedyResult = solveGreedyNearestNeighbor({ start, costMatrix });
  const minOutgoingCosts = getMinOutgoingCosts(costMatrix);
  let bestRoute = greedyResult.route;
  let bestCost = greedyResult.totalCost;

  function search(current: number, route: number[], visited: Set<number>, currentCost: number): void {
    const lowerBound = calculateLowerBound(current, start, visited, currentCost, costMatrix, minOutgoingCosts);

    if (lowerBound >= bestCost) {
      return;
    }

    if (visited.size === costMatrix.length) {
      const totalCost = Number((currentCost + costMatrix[current][start]).toFixed(2));

      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestRoute = [...route, start];
      }

      return;
    }

    const candidates = costMatrix[current]
      .map((cost, location) => ({ cost, location }))
      .filter(({ location }) => !visited.has(location))
      .sort((left, right) => left.cost - right.cost);

    for (const { cost, location } of candidates) {
      if (currentCost + cost >= bestCost) {
        continue;
      }

      visited.add(location);
      route.push(location);
      search(location, route, visited, currentCost + cost);
      route.pop();
      visited.delete(location);
    }
  }

  search(start, [start], new Set<number>([start]), 0);

  return {
    route: bestRoute,
    totalCost: bestCost,
    runtimeMs: Number((performance.now() - startedAt).toFixed(3))
  };
}
