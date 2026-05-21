import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import {
  buildPathSegments,
  interpolateCoordinate,
  interpolatePolylineCoordinate,
  partialSegmentCoordinates,
  pathSegmentCoordinates,
} from "./routeAnimation";

describe("path animation utilities", () => {
  it("builds path segments with edge and cumulative costs", () => {
    const dataset = mockDatasets[0];
    const segments = buildPathSegments([1, 2, 3], dataset.nodes, dataset.edges, dataset.directed);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      stepIndex: 0,
      from: 1,
      to: 2,
      edgeCost: 2.5,
      cumulativeCost: 2.5,
    });
    expect(segments[1].cumulativeCost).toBe(4.7);
    expect(segments[0].coordinates.length).toBeGreaterThan(2);
  });

  it("interpolates coordinates and clamps progress", () => {
    expect(interpolateCoordinate([10, 100], [20, 120], 0)).toEqual([10, 100]);
    expect(interpolateCoordinate([10, 100], [20, 120], 0.5)).toEqual([15, 110]);
    expect(interpolateCoordinate([10, 100], [20, 120], 2)).toEqual([20, 120]);
  });

  it("returns drawable coordinates from segments", () => {
    const dataset = mockDatasets[0];
    const segments = buildPathSegments([1, 2], dataset.nodes, dataset.edges, dataset.directed);
    const coordinates = pathSegmentCoordinates(segments);

    expect(coordinates[0]).toEqual([dataset.nodes[1].lat, dataset.nodes[1].lng]);
    expect(coordinates.at(-1)).toEqual([dataset.nodes[2].lat, dataset.nodes[2].lng]);
    expect(coordinates.length).toBeGreaterThan(2);
  });

  it("interpolates along a bent polyline and returns partial coordinates", () => {
    const coordinates: [number, number][] = [
      [0, 0],
      [0, 2],
      [2, 2],
    ];

    expect(interpolatePolylineCoordinate(coordinates, 0)).toEqual([0, 0]);
    expect(interpolatePolylineCoordinate(coordinates, 0.5)).toEqual([0, 2]);
    expect(interpolatePolylineCoordinate(coordinates, 1)).toEqual([2, 2]);

    const dataset = mockDatasets[0];
    const [segment] = buildPathSegments([1, 2], dataset.nodes, dataset.edges, dataset.directed);
    const partial = partialSegmentCoordinates(segment, 0.5);

    expect(partial[0]).toEqual(segment.coordinates[0]);
    expect(partial.length).toBeGreaterThanOrEqual(2);
  });
});
