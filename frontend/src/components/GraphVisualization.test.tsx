import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import type { RoutePlaybackSnapshot } from "../types/tsp";
import { buildRouteSegments, interpolateCoordinate } from "../utils/routeAnimation";
import { GraphVisualization } from "./GraphVisualization";

describe("GraphVisualization", () => {
  it("marks completed, current, and pending route edges during playback", () => {
    const dataset = mockDatasets[0];
    const route = [0, 1, 2, 0];
    const segments = buildRouteSegments(route, dataset.locations, dataset.costMatrix);
    const snapshot: RoutePlaybackSnapshot = {
      algorithm: "greedy",
      segments,
      segmentCount: segments.length,
      activeStep: 1,
      completedStepCount: 1,
      segmentProgress: 0.4,
      currentSegment: segments[1],
      movingPosition: interpolateCoordinate(segments[1].fromCoordinate, segments[1].toCoordinate, 0.4),
      currentCost: segments[0].cumulativeCost + segments[1].edgeCost * 0.4,
      isComplete: false,
    };

    const { container } = render(
      <GraphVisualization
        dataset={dataset}
        results={{ greedy: { route, totalCost: 12, runtimeMs: 2 } }}
        visibleRoutes={{ greedy: true, branchAndBound: true }}
        playback={snapshot}
      />
    );

    expect(container.querySelector(".graph-edge.greedy.completed")).toBeInTheDocument();
    expect(container.querySelector(".graph-edge.greedy.current")).toBeInTheDocument();
    expect(container.querySelector(".graph-edge.greedy.pending")).toBeInTheDocument();
  });
});
