import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { isCompleteTour } from "../utils/route";
import { solverClient } from "./solverClient";

describe("solverClient", () => {
  it("returns a contract-compatible Greedy result", async () => {
    const dataset = mockDatasets[1];
    const result = await solverClient.solveGreedy({
      start: 0,
      costMatrix: dataset.costMatrix,
    });

    expect(isCompleteTour(result.route, dataset.locations.length, 0)).toBe(true);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.runtimeMs).toBeGreaterThan(0);
  });

  it("returns a Branch and Bound result that is no worse than Greedy", async () => {
    const dataset = mockDatasets[1];
    const request = { start: 0, costMatrix: dataset.costMatrix };
    const greedy = await solverClient.solveGreedy(request);
    const branchAndBound = await solverClient.solveBranchAndBound(request);

    expect(isCompleteTour(branchAndBound.route, dataset.locations.length, 0)).toBe(true);
    expect(branchAndBound.totalCost).toBeLessThanOrEqual(greedy.totalCost);
  });
});
