import { describe, expect, it } from "vitest";
import { validateSolveRequest } from "./solveRequestValidator.js";

describe("validateSolveRequest", () => {
  it("accepts a valid square matrix and start index", () => {
    const issues = validateSolveRequest({
      start: 0,
      costMatrix: [
        [0, 4],
        [4, 0]
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("rejects non-square matrices", () => {
    const issues = validateSolveRequest({
      start: 0,
      costMatrix: [[0, 4], [4]]
    });

    expect(issues.some((issue) => issue.code === "matrix-not-square")).toBe(true);
  });

  it("rejects invalid start indexes and negative costs", () => {
    const issues = validateSolveRequest({
      start: 3,
      costMatrix: [
        [0, -4],
        [4, 0]
      ]
    });

    expect(issues.some((issue) => issue.code === "start-out-of-range")).toBe(true);
    expect(issues.some((issue) => issue.code === "matrix-negative")).toBe(true);
  });
});
