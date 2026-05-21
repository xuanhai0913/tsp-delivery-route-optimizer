import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { calculateHeuristicScale, solverClient } from "./solverClient";

describe("solverClient", () => {
  it("returns a contract-compatible Dijkstra result", async () => {
    const dataset = mockDatasets[0];
    const result = await solverClient.solveDijkstra({
      source: dataset.defaultSource,
      target: dataset.defaultTarget,
      nodes: dataset.nodes,
      edges: dataset.edges,
      directed: dataset.directed,
    });

    expect(result.path[0]).toBe(dataset.defaultSource);
    expect(result.path.at(-1)).toBe(dataset.defaultTarget);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.runtimeMs).toBeGreaterThan(0);
    expect(result.traceSteps?.map((step) => step.phase)).toContain("select-current");
    expect(result.traceSteps?.map((step) => step.phase)).toContain("relax-edge");
    expect(result.traceSteps?.at(-1)?.phase).toBe("final-path");
  });

  it("returns A* mock result with the same path cost as Dijkstra", async () => {
    const dataset = mockDatasets[0];
    const request = {
      source: dataset.defaultSource,
      target: dataset.defaultTarget,
      nodes: dataset.nodes,
      edges: dataset.edges,
      directed: dataset.directed,
    };
    const dijkstra = await solverClient.solveDijkstra(request);
    const aStar = await solverClient.solveAStar(request);

    expect(aStar.path[0]).toBe(dataset.defaultSource);
    expect(aStar.path.at(-1)).toBe(dataset.defaultTarget);
    expect(aStar.totalCost).toBe(dijkstra.totalCost);
    expect(aStar.traceSteps?.some((step) => step.nodes.some((node) => node.hCost !== undefined && node.fCost !== undefined))).toBe(true);
  });

  it("uses a conservative non-negative heuristic scale", () => {
    const dataset = mockDatasets[0];
    const scale = calculateHeuristicScale(dataset.nodes, dataset.edges);

    expect(scale).toBeGreaterThanOrEqual(0);
  });
});
