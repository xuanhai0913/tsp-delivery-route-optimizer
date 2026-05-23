import { describe, expect, it } from "vitest";

import type { GraphEdge, GraphNode, PathSolveRequest } from "../../types/path.js";
import { dijkstra, solveDijkstra } from "./dijkstra.js";

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

describe("dijkstra solver", () => {
  it("computes the shortest path with total cost and replay trace", () => {
    const result = solveDijkstra(request());

    expect(result.path).toEqual([0, 2, 1, 3]);
    expect(result.totalCost).toBe(3);
    expect(result.visitedOrder).toEqual([0, 2, 1, 3]);
    expect(result.relaxedEdges).toContainEqual({ from: 1, to: 3, cumulativeCost: 3 });
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
    expect(dijkstra(nodes, edges, 0, 3, true)).toEqual([0, 2, 1, 3]);
  });

  it("updates a queued node when a cheaper path is found later", () => {
    const staleEdges: GraphEdge[] = [
      { id: "0-1", from: 0, to: 1, weight: 10 },
      { id: "0-2", from: 0, to: 2, weight: 1 },
      { id: "2-1", from: 2, to: 1, weight: 1 }
    ];

    const result = solveDijkstra(request({ target: 1, edges: staleEdges }));

    expect(result.path).toEqual([0, 2, 1]);
    expect(result.totalCost).toBe(2);
  });

  it("supports reverse traversal for undirected graphs", () => {
    const result = solveDijkstra(request({ source: 3, target: 0, directed: false }));

    expect(result.path).toEqual([3, 1, 2, 0]);
    expect(result.totalCost).toBe(3);
  });

  it("does not traverse reverse edges when the graph is directed", () => {
    const result = solveDijkstra(request({ source: 3, target: 0, directed: true }));

    expect(result.path).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.traceSteps?.at(-1)?.message).toContain("Không tìm thấy");
  });
});
