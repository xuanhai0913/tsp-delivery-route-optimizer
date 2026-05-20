import { describe, expect, it } from "vitest";

import { isCompleteTour } from "../../utils/route.js";
import { solveBranchAndBound } from "./branchAndBound.js";

describe("solveBranchAndBound", () => {
  it("finds the optimal TSP route for a small matrix", () => {
    const result = solveBranchAndBound({
      start: 0,
      costMatrix: [
        [0, 4, 1, 9],
        [4, 0, 6, 2],
        [1, 6, 0, 3],
        [9, 2, 3, 0]
      ]
    });

    expect(result.totalCost).toBe(10);
    expect(isCompleteTour(result.route, 4, 0)).toBe(true);
  });
});
