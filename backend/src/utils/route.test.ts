import { describe, expect, it } from "vitest";
import { calculateRouteCost, isCompleteTour } from "./route.js";

describe("route utilities", () => {
  const costMatrix = [
    [0, 10, 15],
    [10, 0, 20],
    [15, 20, 0]
  ];

  it("calculates route cost including return to start", () => {
    expect(calculateRouteCost([0, 1, 2, 0], costMatrix)).toBe(45);
  });

  it("accepts a complete TSP tour", () => {
    expect(isCompleteTour([0, 2, 1, 0], 3, 0)).toBe(true);
  });

  it("rejects routes that skip a location", () => {
    expect(isCompleteTour([0, 2, 0], 3, 0)).toBe(false);
  });
});
