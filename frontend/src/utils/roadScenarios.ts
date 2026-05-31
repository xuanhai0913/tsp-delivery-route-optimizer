import type { Dataset, GeoPoint, GraphEdge, RoadScenario } from "../types/path";

function cloneGeometry(geometry: GeoPoint[] | undefined): GeoPoint[] | undefined {
  return geometry?.map((point) => ({ ...point }));
}

function cloneEdge(edge: GraphEdge): GraphEdge {
  return {
    ...edge,
    geometry: cloneGeometry(edge.geometry),
  };
}

export function getScenarioAffectedEdgeIds(dataset: Dataset, scenario: RoadScenario): string[] {
  if (scenario.key === "normal") {
    return [];
  }

  if (scenario.key === "rain") {
    return dataset.edges.map((edge) => edge.id);
  }

  return scenario.affectedEdgeIds;
}

export function applyRoadScenario(dataset: Dataset, scenario: RoadScenario): Dataset {
  const affectedEdgeIds = new Set(getScenarioAffectedEdgeIds(dataset, scenario));
  const blockedEdgeIds = new Set(scenario.blockedEdgeIds ?? []);

  const edges = dataset.edges
    .filter((edge) => !blockedEdgeIds.has(edge.id))
    .map((edge) => {
      const nextEdge = cloneEdge(edge);

      if (scenario.weightMultiplier && affectedEdgeIds.has(edge.id)) {
        nextEdge.weight = Number((edge.weight * scenario.weightMultiplier).toFixed(2));
      }

      return nextEdge;
    });

  return {
    ...dataset,
    id: scenario.key === "normal" ? dataset.id : `${dataset.id}-${scenario.key}`,
    name: scenario.key === "normal" ? dataset.name : `${dataset.name} · ${scenario.label}`,
    edges,
  };
}
