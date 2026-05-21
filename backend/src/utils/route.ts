import type { GraphEdge } from "../types/path.js";

export function calculatePathCost(path: number[], edges: GraphEdge[], directed = false): number {
  if (path.length < 2) {
    return 0;
  }

  let totalCost = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const edge = edges.find(
      (candidate) =>
        (candidate.from === from && candidate.to === to) ||
        (!directed && candidate.from === to && candidate.to === from)
    );

    if (!edge) {
      return Number.POSITIVE_INFINITY;
    }

    totalCost += edge.weight;
  }

  return Number(totalCost.toFixed(2));
}
