import { describe, expect, it } from "vitest";

import type { GraphEdge, GraphNode, PathSolveRequest } from "../../types/path.js";
import { floydWarshall, NegativeCycleError, solveFloydWarshall } from "./floydWarshall.js";

const nodes: GraphNode[] = [
  { id: 0, name: "A", lat: 10, lng: 106 },
  { id: 1, name: "B", lat: 10.1, lng: 106.1 },
  { id: 2, name: "C", lat: 10.2, lng: 106.2 },
  { id: 3, name: "D", lat: 10.3, lng: 106.3 },
  { id: 4, name: "E", lat: 10.4, lng: 106.4 }
];

const edges: GraphEdge[] = [
  { id: "0-1", from: 0, to: 1, weight: 4 },
  { id: "0-2", from: 0, to: 2, weight: 1 },
  { id: "2-1", from: 2, to: 1, weight: 1 },
  { id: "1-3", from: 1, to: 3, weight: 1 },
  { id: "2-3", from: 2, to: 3, weight: 5 }
];

function request(overrides: Partial<PathSolveRequest> = {}): PathSolveRequest {
  return {
    source: 0,
    target: 3,
    nodes,
    edges,
    directed: true,
    ...overrides
  };
}

describe("floyd-warshall solver", () => {
  it("computes the shortest path with matrix-update trace data", () => {
    const result = solveFloydWarshall(request());

    expect(result.path).toEqual([0, 2, 1, 3]);
    expect(result.totalCost).toBe(3);
    expect(result.visitedOrder).toEqual([0, 1, 2, 3, 4]);
    expect(result.relaxedEdges).toContainEqual({ from: 0, to: 3, cumulativeCost: 3 });
    expect(result.traceSteps?.map((step) => step.phase)).toContain("select-current");
    expect(result.traceSteps?.map((step) => step.phase)).toContain("relax-edge");
    expect(result.traceSteps?.at(-1)).toMatchObject({
      phase: "final-path",
      currentNode: 3
    });
    expect(result.traceSteps?.at(-1)?.nodes.filter((node) => node.status === "path").map((node) => node.node))
      .toEqual([0, 1, 2, 3]);
  });

  it("keeps a path-only helper for simple algorithm checks", () => {
    expect(floydWarshall(nodes, edges, 0, 3, true)).toEqual([0, 2, 1, 3]);
  });

  it("supports reverse traversal for undirected graphs", () => {
    const result = solveFloydWarshall(request({ source: 3, target: 0, directed: false }));

    expect(result.path).toEqual([3, 1, 2, 0]);
    expect(result.totalCost).toBe(3);
  });

  it("does not traverse reverse edges when the graph is directed", () => {
    const result = solveFloydWarshall(request({ source: 3, target: 0, directed: true }));

    expect(result.path).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.traceSteps?.at(-1)?.message).toContain("Không tìm thấy");
  });

  it("handles negative directed edges when there is no negative cycle", () => {
    const negativeEdges: GraphEdge[] = [
      { id: "0-1", from: 0, to: 1, weight: 4 },
      { id: "0-2", from: 0, to: 2, weight: 5 },
      { id: "1-2", from: 1, to: 2, weight: -2 },
      { id: "2-3", from: 2, to: 3, weight: 3 },
      { id: "1-3", from: 1, to: 3, weight: 10 }
    ];

    const result = solveFloydWarshall(request({ edges: negativeEdges }));

    expect(result.path).toEqual([0, 1, 2, 3]);
    expect(result.totalCost).toBe(5);
  });

  it("detects negative-weight cycles", () => {
    const negativeCycleEdges: GraphEdge[] = [
      { id: "0-1", from: 0, to: 1, weight: 1 },
      { id: "1-2", from: 1, to: 2, weight: -3 },
      { id: "2-0", from: 2, to: 0, weight: 1 }
    ];

    expect(() => solveFloydWarshall(request({ edges: negativeCycleEdges }))).toThrow(NegativeCycleError);
  });
});
