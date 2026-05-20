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

  it("uses the selected start location", () => {
    const result = solveGreedyNearestNeighbor({
      start: 2,
      costMatrix: [
        [0, 4, 9, 8],
        [4, 0, 3, 7],
        [9, 3, 0, 2],
        [8, 7, 2, 0]
      ]
    });

    expect(result.route).toEqual([2, 3, 1, 0, 2]);
    expect(result.totalCost).toBe(22);
    expect(isCompleteTour(result.route, 4, 2)).toBe(true);
  });

  it("keeps tie-breaking deterministic by choosing the lowest index first", () => {
    const result = solveGreedyNearestNeighbor({
      start: 0,
      costMatrix: [
        [0, 5, 5],
        [5, 0, 1],
        [5, 1, 0]
      ]
    });

    expect(result.route).toEqual([0, 1, 2, 0]);
    expect(result.totalCost).toBe(11);
  });

  it("demonstrates that nearest-neighbor can miss the optimal route", () => {
    const result = solveGreedyNearestNeighbor({
      start: 0,
      costMatrix: [
        [0, 11, 6, 29, 27],
        [11, 0, 27, 28, 6],
        [6, 27, 0, 16, 10],
        [29, 28, 16, 0, 18],
        [27, 6, 10, 18, 0]
      ]
    });

    expect(result.route).toEqual([0, 2, 4, 1, 3, 0]);
    expect(result.totalCost).toBe(79);
    expect(result.totalCost).toBeGreaterThan(57);
  });
});
