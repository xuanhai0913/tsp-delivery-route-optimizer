import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import {
  buildRouteSegments,
  interpolateCoordinate,
  routeSegmentCoordinates,
} from "./routeAnimation";

describe("route animation utilities", () => {
  it("builds route segments with edge and cumulative costs", () => {
    const dataset = mockDatasets[0];
    const segments = buildRouteSegments([0, 1, 2, 0], dataset.locations, dataset.costMatrix);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({
      stepIndex: 0,
      from: 0,
      to: 1,
      edgeCost: dataset.costMatrix[0][1],
      cumulativeCost: dataset.costMatrix[0][1],
    });
    expect(segments[1].cumulativeCost).toBe(
      Number((dataset.costMatrix[0][1] + dataset.costMatrix[1][2]).toFixed(2))
    );
  });

  it("interpolates coordinates and clamps progress", () => {
    expect(interpolateCoordinate([10, 100], [20, 120], 0)).toEqual([10, 100]);
    expect(interpolateCoordinate([10, 100], [20, 120], 0.5)).toEqual([15, 110]);
    expect(interpolateCoordinate([10, 100], [20, 120], 2)).toEqual([20, 120]);
  });

  it("returns drawable coordinates from segments", () => {
    const dataset = mockDatasets[0];
    const segments = buildRouteSegments([0, 1, 0], dataset.locations, dataset.costMatrix);
    const coordinates = routeSegmentCoordinates(segments);

    expect(coordinates).toEqual([
      [dataset.locations[0].lat, dataset.locations[0].lng],
      [dataset.locations[1].lat, dataset.locations[1].lng],
      [dataset.locations[0].lat, dataset.locations[0].lng],
    ]);
  });
});
