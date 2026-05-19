import { describe, expect, it } from "vitest";
import { calculateRouteCost, isCompleteTour, routeToCoordinates } from "./route";
import { mockDatasets } from "../data/mockDatasets";

describe("route utilities", () => {
  it("calculates route cost from a matrix", () => {
    const cost = calculateRouteCost([0, 1, 2, 0], [
      [0, 10, 15],
      [10, 0, 20],
      [15, 20, 0],
    ]);

    expect(cost).toBe(45);
  });

  it("validates a complete tour", () => {
    expect(isCompleteTour([0, 2, 1, 0], 3, 0)).toBe(true);
    expect(isCompleteTour([0, 2, 0], 3, 0)).toBe(false);
  });

  it("maps route ids to coordinates", () => {
    const dataset = mockDatasets[0];
    const coordinates = routeToCoordinates([0, 1, 0], dataset.locations);

    expect(coordinates).toHaveLength(3);
    expect(coordinates[0]).toEqual([dataset.locations[0].lat, dataset.locations[0].lng]);
  });
});
