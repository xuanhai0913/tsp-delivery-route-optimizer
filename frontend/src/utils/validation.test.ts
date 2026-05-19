import { describe, expect, it } from "vitest";
import { validateSolveRequest } from "./validation";

describe("validateSolveRequest", () => {
  it("accepts a square numeric matrix with a valid start index", () => {
    expect(
      validateSolveRequest({
        start: 0,
        costMatrix: [
          [0, 1],
          [1, 0],
        ],
      })
    ).toHaveLength(0);
  });

  it("reports non-square matrices", () => {
    const issues = validateSolveRequest({
      start: 0,
      costMatrix: [[0, 1], [1]],
    });

    expect(issues.some((issue) => issue.code === "matrix-not-square")).toBe(true);
  });

  it("reports negative costs and invalid start indexes", () => {
    const issues = validateSolveRequest({
      start: 3,
      costMatrix: [
        [0, -1],
        [1, 0],
      ],
    });

    expect(issues.some((issue) => issue.code === "start-out-of-range")).toBe(true);
    expect(issues.some((issue) => issue.code === "matrix-negative")).toBe(true);
  });
});
