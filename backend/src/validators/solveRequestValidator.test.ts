import { describe, expect, it } from "vitest";

import { validateSolveRequest } from "./solveRequestValidator.js";

const nodes = [
  { id: 0, name: "A", lat: 10, lng: 106 },
  { id: 1, name: "B", lat: 10.1, lng: 106.1 },
  { id: 2, name: "C", lat: 10.2, lng: 106.2 }
];

const edges = [
  { id: "0-1", from: 0, to: 1, weight: 4 },
  { id: "1-2", from: 1, to: 2, weight: 5 }
];

describe("validateSolveRequest", () => {
  it("accepts a valid graph, source, and target", () => {
    const issues = validateSolveRequest({
      source: 0,
      target: 2,
      nodes,
      edges,
      directed: false
    });

    expect(issues).toHaveLength(0);
  });

  it("rejects missing graph collections", () => {
    const issues = validateSolveRequest({
      source: 0,
      target: 1,
      nodes: [],
      edges: []
    });

    expect(issues.some((issue) => issue.code === "nodes-empty")).toBe(true);
    expect(issues.some((issue) => issue.code === "edges-empty")).toBe(true);
  });

  it("rejects invalid source/target and edge references", () => {
    const issues = validateSolveRequest({
      source: 9,
      target: 9,
      nodes,
      edges: [{ id: "bad", from: 0, to: 99, weight: -1 }]
    });

    expect(issues.some((issue) => issue.code === "source-not-found")).toBe(true);
    expect(issues.some((issue) => issue.code === "target-not-found")).toBe(true);
    expect(
  issues.some(
    (issue) =>
      issue.code === "edge-invalid" ||
      issue.code === "edge-node-not-found"
  )
).toBe(true);
  });
});
