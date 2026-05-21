import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { validateSolveRequest } from "./validation";

describe("validateSolveRequest", () => {
  it("accepts a graph with valid source and target", () => {
    const dataset = mockDatasets[0];
    expect(
      validateSolveRequest({
        source: dataset.defaultSource,
        target: dataset.defaultTarget,
        nodes: dataset.nodes,
        edges: dataset.edges,
        directed: dataset.directed,
      })
    ).toHaveLength(0);
  });

  it("reports missing graph collections", () => {
    const issues = validateSolveRequest({
      source: 0,
      target: 1,
      nodes: [],
      edges: [],
    });

    expect(issues.some((issue) => issue.code === "nodes-empty")).toBe(true);
    expect(issues.some((issue) => issue.code === "edges-empty")).toBe(true);
  });

  it("reports invalid source/target and bad edge refs", () => {
    const dataset = mockDatasets[0];
    const issues = validateSolveRequest({
      source: 99,
      target: 99,
      nodes: dataset.nodes,
      edges: [{ id: "bad", from: 0, to: 99, weight: 1 }],
    });

    expect(issues.some((issue) => issue.code === "source-invalid")).toBe(true);
    expect(issues.some((issue) => issue.code === "target-invalid")).toBe(true);
    expect(issues.some((issue) => issue.code === "edge-node-missing")).toBe(true);
  });
});
