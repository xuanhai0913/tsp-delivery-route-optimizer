import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RoutePlaybackSnapshot } from "../types/path";
import { AlgorithmStateTable } from "./AlgorithmStateTable";

function makeSnapshot(): RoutePlaybackSnapshot {
  return {
    algorithm: "aStar",
    segments: [],
    segmentCount: 1,
    activeStep: 0,
    completedStepCount: 0,
    segmentProgress: 0,
    currentCost: 0,
    isComplete: false,
    isTraceMode: true,
    completedTraceSteps: [],
    currentTraceStep: {
      stepIndex: 0,
      phase: "select-current",
      currentNode: 1,
      queue: [],
      message: "Chọn node 1",
      nodes: [
        { node: 1, status: "current", gCost: 0, hCost: 1.2, fCost: 1.2 },
        { node: 2, status: "queued", gCost: 2.5, hCost: 0.7, fCost: 3.2, previous: 1 },
      ],
    },
  };
}

describe("AlgorithmStateTable", () => {
  it("renders A* metrics columns", () => {
    render(<AlgorithmStateTable algorithm="aStar" snapshot={makeSnapshot()} />);

    expect(screen.getByText("g(n)")).toBeInTheDocument();
    expect(screen.getByText("h(n)")).toBeInTheDocument();
    expect(screen.getByText("f(n)")).toBeInTheDocument();
    expect(screen.getByText("Đang xét")).toBeInTheDocument();
  });

  it("renders Dijkstra distance column", () => {
    render(<AlgorithmStateTable algorithm="dijkstra" snapshot={makeSnapshot()} />);

    expect(screen.getByText("Dist")).toBeInTheDocument();
  });
});
