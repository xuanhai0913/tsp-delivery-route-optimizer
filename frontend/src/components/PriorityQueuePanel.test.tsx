import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RoutePlaybackSnapshot } from "../types/path";
import { PriorityQueuePanel } from "./PriorityQueuePanel";

describe("PriorityQueuePanel", () => {
  it("sorts queue entries by priority", () => {
    const snapshot: RoutePlaybackSnapshot = {
      algorithm: "dijkstra",
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
        message: "Queue",
        nodes: [],
        queue: [
          { node: 5, priority: 4.6, cost: 4.6 },
          { node: 2, priority: 2.5, cost: 2.5 },
        ],
      },
    };

    render(<PriorityQueuePanel snapshot={snapshot} />);
    const items = screen.getAllByRole("listitem");

    expect(within(items[0]).getByText("Node 2")).toBeInTheDocument();
    expect(within(items[1]).getByText("Node 5")).toBeInTheDocument();
  });
});
