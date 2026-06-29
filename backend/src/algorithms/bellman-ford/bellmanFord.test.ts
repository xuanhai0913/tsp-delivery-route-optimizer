import { describe, expect, it } from "vitest";
import { bellmanFord, solveBellmanFord, NegativeCycleError } from "./bellmanFord.js";

describe("Bellman-Ford Solver", () => {
  const nodes = [
    { id: 1, name: "A", lat: 0, lng: 0 },
    { id: 2, name: "B", lat: 0, lng: 0 },
    { id: 3, name: "C", lat: 0, lng: 0 },
    { id: 4, name: "D", lat: 0, lng: 0 },
  ];

  it("should find shortest path in graph with positive weights", () => {
    const edges = [
      { id: "e1-2", from: 1, to: 2, weight: 2 },
      { id: "e2-3", from: 2, to: 3, weight: 3 },
      { id: "e1-3", from: 1, to: 3, weight: 10 },
    ];
    const path = bellmanFord(nodes, edges, 1, 3, true);
    expect(path).toEqual([1, 2, 3]);
  });

  it("should handle negative weights without negative cycle", () => {
    const edges = [
      { id: "e1-2", from: 1, to: 2, weight: 4 },
      { id: "e2-3", from: 2, to: 3, weight: -2 },
      { id: "e1-3", from: 1, to: 3, weight: 3 },
    ];
    const path = bellmanFord(nodes, edges, 1, 3, true);
    expect(path).toEqual([1, 2, 3]); // 4 + (-2) = 2 < 3
  });

  it("should detect negative cycle", () => {
    const edges = [
      { id: "e1-2", from: 1, to: 2, weight: 1 },
      { id: "e2-3", from: 2, to: 3, weight: -2 },
      { id: "e3-2", from: 3, to: 2, weight: 1 }, // 2 → 3 → 2: -1 (chu trình âm)
    ];
    expect(() => {
      solveBellmanFord({ source: 1, target: 3, nodes, edges, directed: true });
    }).toThrow(NegativeCycleError);
  });

  it("should work with undirected graph", () => {
    const edges = [
      { id: "e1-2", from: 1, to: 2, weight: 5 },
      { id: "e2-3", from: 2, to: 3, weight: 1 },
    ];
    const path = bellmanFord(nodes, edges, 1, 3, false);
    expect(path).toEqual([1, 2, 3]);
  });
});