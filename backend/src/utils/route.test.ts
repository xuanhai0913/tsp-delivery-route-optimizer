import { describe, expect, it } from "vitest";

import { calculatePathCost } from "./route.js";

const edges = [
  { id: "0-1", from: 0, to: 1, weight: 4 },
  { id: "1-2", from: 1, to: 2, weight: 5 }
];

describe("path utilities", () => {
  it("calculates path cost from graph edges", () => {
    expect(calculatePathCost([0, 1, 2], edges)).toBe(9);
  });

  it("supports reverse travel when the graph is undirected", () => {
    expect(calculatePathCost([2, 1, 0], edges, false)).toBe(9);
  });

  it("returns infinity for a missing directed edge", () => {
    expect(calculatePathCost([2, 1, 0], edges, true)).toBe(Number.POSITIVE_INFINITY);
  });
});
