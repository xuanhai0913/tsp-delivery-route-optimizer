import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import type { RoutePlaybackSnapshot } from "../types/path";
import { buildPathSegments, interpolateCoordinate } from "../utils/routeAnimation";
import { GraphVisualization } from "./GraphVisualization";

describe("GraphVisualization", () => {
  it("marks completed, current, and pending path edges during playback", () => {
    const dataset = mockDatasets[0];
    const path = [1, 2, 3, 6];
    const segments = buildPathSegments(path, dataset.nodes, dataset.edges, dataset.directed);
    const snapshot: RoutePlaybackSnapshot = {
      algorithm: "dijkstra",
      segments,
      segmentCount: segments.length,
      activeStep: 1,
      completedStepCount: 1,
      segmentProgress: 0.4,
      currentSegment: segments[1],
      movingPosition: interpolateCoordinate(segments[1].fromCoordinate, segments[1].toCoordinate, 0.4),
      currentCost: segments[0].cumulativeCost + segments[1].edgeCost * 0.4,
      isComplete: false,
      completedTraceSteps: [],
      isTraceMode: false,
    };

    const { container } = render(
      <GraphVisualization
        dataset={dataset}
        results={{ dijkstra: { path, totalCost: 7.5, runtimeMs: 8 } }}
        visibleRoutes={{ dijkstra: true, aStar: true }}
        playback={snapshot}
      />
    );

    expect(container.querySelector(".graph-edge.dijkstra.completed")).toBeInTheDocument();
    expect(container.querySelector(".graph-edge.dijkstra.current")).toBeInTheDocument();
    expect(container.querySelector(".graph-edge.dijkstra.pending")).toBeInTheDocument();
  });

  it("highlights current relaxed edge from algorithm trace", () => {
    const dataset = mockDatasets[0];
    const snapshot: RoutePlaybackSnapshot = {
      algorithm: "aStar",
      segments: [],
      segmentCount: 1,
      activeStep: 0,
      completedStepCount: 0,
      segmentProgress: 0.5,
      currentCost: 2.5,
      isComplete: false,
      isTraceMode: true,
      completedTraceSteps: [],
      currentTraceStep: {
        stepIndex: 0,
        phase: "relax-edge",
        currentNode: 1,
        relaxedEdge: { id: "e1-2", from: 1, to: 2, weight: 2.5, cumulativeCost: 2.5 },
        queue: [],
        nodes: dataset.nodes.map((node) => ({
          node: node.id,
          status: node.id === 1 ? "current" : node.id === 2 ? "queued" : "unvisited",
        })),
        message: "Relax 1 -> 2",
      },
    };

    const { container } = render(
      <GraphVisualization
        dataset={dataset}
        results={{ aStar: { path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 5 } }}
        visibleRoutes={{ dijkstra: true, aStar: true }}
        playback={snapshot}
      />
    );

    expect(container.querySelector(".graph-base-edge.current.aStar")).toBeInTheDocument();
    expect(container.querySelector(".graph-node.queued")).toBeInTheDocument();
  });
});
