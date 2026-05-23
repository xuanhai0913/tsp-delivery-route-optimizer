import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { calculateHeuristicScale, solverClient } from "./solverClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("solverClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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
    expect(result.resultSource).toBe("mock");
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
    expect(aStar.resultSource).toBe("mock");
    expect(aStar.traceSteps?.some((step) => step.nodes.some((node) => node.hCost !== undefined && node.fCost !== undefined))).toBe(true);
  });

  it("posts Dijkstra requests to the backend when API is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
    const backendResult = {
      path: [1, 2, 6],
      totalCost: 7.5,
      runtimeMs: 1.2,
      visitedOrder: [1, 2, 6],
      traceSteps: [{ stepIndex: 0, phase: "final-path", queue: [], nodes: [], message: "done" }],
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(backendResult));
    vi.stubGlobal("fetch", fetchMock);
    const dataset = mockDatasets[0];

    const result = await solverClient.solveDijkstra({
      source: dataset.defaultSource,
      target: dataset.defaultTarget,
      nodes: dataset.nodes,
      edges: dataset.edges,
      directed: dataset.directed,
    });

    expect(result).toMatchObject({ ...backendResult, resultSource: "backend" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/api/solve/dijkstra",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("falls back to mock solving when backend solving fails", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("backend down")));
    const dataset = mockDatasets[0];

    const result = await solverClient.solveAStar({
      source: dataset.defaultSource,
      target: dataset.defaultTarget,
      nodes: dataset.nodes,
      edges: dataset.edges,
      directed: dataset.directed,
    });

    expect(result.resultSource).toBe("mock");
    expect(result.path[0]).toBe(dataset.defaultSource);
    expect(result.path.at(-1)).toBe(dataset.defaultTarget);
  });

  it("uses a conservative non-negative heuristic scale", () => {
    const dataset = mockDatasets[0];
    const scale = calculateHeuristicScale(dataset.nodes, dataset.edges);

    expect(scale).toBeGreaterThanOrEqual(0);
  });
});
