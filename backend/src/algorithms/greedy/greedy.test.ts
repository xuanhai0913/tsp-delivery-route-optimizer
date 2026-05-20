import { describe, expect, it } from "vitest";

import { isCompleteTour } from "../../utils/route.js";
import { solveGreedyNearestNeighbor } from "./greedy.js";

describe("solveGreedyNearestNeighbor", () => {
  it("returns a complete route with total cost and runtime", () => {
    const result = solveGreedyNearestNeighbor({
      start: 0,
      costMatrix: [
        [0, 10, 15],
        [10, 0, 20],
        [15, 20, 0]
      ]
    });

    expect(result.route).toEqual([0, 1, 2, 0]);
    expect(result.totalCost).toBe(45);
    expect(result.runtimeMs).toBeGreaterThanOrEqual(0);
    expect(isCompleteTour(result.route, 3, 0)).toBe(true);
  });
});
