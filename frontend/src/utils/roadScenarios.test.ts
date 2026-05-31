import { describe, expect, it } from "vitest";
import { roadScenarios } from "../data/roadScenarios";
import { mockDatasets } from "../data/mockDatasets";
import { applyRoadScenario, getScenarioAffectedEdgeIds } from "./roadScenarios";

const dataset = mockDatasets[0];

describe("road scenario utilities", () => {
  it("applies rain multiplier to every edge without mutating the source dataset", () => {
    const rain = roadScenarios.find((scenario) => scenario.key === "rain")!;
    const originalWeight = dataset.edges[0].weight;
    const adjusted = applyRoadScenario(dataset, rain);

    expect(adjusted.edges[0].weight).toBe(Number((originalWeight * 1.15).toFixed(2)));
    expect(dataset.edges[0].weight).toBe(originalWeight);
    expect(adjusted.edges[0]).not.toBe(dataset.edges[0]);
  });

  it("applies rush-hour multiplier only to affected edges", () => {
    const rushHour = roadScenarios.find((scenario) => scenario.key === "rushHour")!;
    const adjusted = applyRoadScenario(dataset, rushHour);
    const affectedEdge = adjusted.edges.find((edge) => edge.id === "e3-6")!;
    const normalEdge = adjusted.edges.find((edge) => edge.id === "e0-1")!;

    expect(affectedEdge.weight).toBe(6.16);
    expect(normalEdge.weight).toBe(3.4);
  });

  it("removes blocked edges from the solve graph", () => {
    const blocked = roadScenarios.find((scenario) => scenario.key === "blockedRoad")!;
    const adjusted = applyRoadScenario(dataset, blocked);

    expect(adjusted.edges.some((edge) => edge.id === "e3-6")).toBe(false);
    expect(getScenarioAffectedEdgeIds(dataset, blocked)).toEqual(["e3-6"]);
  });
});
