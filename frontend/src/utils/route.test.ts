import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { calculatePathCost, edgeToCoordinates, pathToCoordinates } from "./route";

describe("path utilities", () => {
  it("calculates path cost from graph edges", () => {
    const dataset = mockDatasets[0];

    expect(calculatePathCost([1, 2, 3, 6], dataset.edges, dataset.directed)).toBe(7.5);
  });

  it("maps path ids to road geometry coordinates", () => {
    const dataset = mockDatasets[0];
    const coordinates = pathToCoordinates([1, 2], dataset.nodes, dataset.edges, dataset.directed);
    const edge = dataset.edges.find((item) => item.id === "e1-2");
    const source = dataset.nodes.find((node) => node.id === 1)!;

    expect(edge).toBeDefined();
    expect(coordinates).toHaveLength(edge!.geometry!.length);
    expect(coordinates[0]).toEqual([source.lat, source.lng]);
  });

  it("reverses geometry for undirected reverse traversal", () => {
    const dataset = mockDatasets[0];
    const edge = dataset.edges.find((item) => item.id === "e1-2");
    const source = dataset.nodes.find((node) => node.id === 1)!;
    const target = dataset.nodes.find((node) => node.id === 2)!;

    expect(edge).toBeDefined();
    const coordinates = edgeToCoordinates(edge!, dataset.nodes, dataset.directed, 2, 1);

    expect(coordinates[0]).toEqual([target.lat, target.lng]);
    expect(coordinates.at(-1)).toEqual([source.lat, source.lng]);
  });
});
