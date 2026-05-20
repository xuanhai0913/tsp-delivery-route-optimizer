import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import type { SolverState } from "../types/tsp";
import { useRoutePlayback } from "./useRoutePlayback";

function PlaybackHarness({ results }: { results: SolverState }) {
  const playback = useRoutePlayback({
    dataset: mockDatasets[0],
    results,
  });

  return (
    <div>
      <span data-testid="algorithm">{playback.selectedAlgorithm}</span>
      <span data-testid="step">{playback.snapshot.activeStep}</span>
      <span data-testid="segments">{playback.snapshot.segmentCount}</span>
      <button type="button" onClick={playback.stepNext}>
        next
      </button>
      <button type="button" onClick={() => playback.setSelectedAlgorithm("greedy")}>
        greedy
      </button>
    </div>
  );
}

describe("useRoutePlayback", () => {
  it("prefers branch-and-bound results and resets when results clear", async () => {
    const results: SolverState = {
      greedy: { route: [0, 1, 0], totalCost: 10, runtimeMs: 2 },
      branchAndBound: { route: [0, 2, 1, 0], totalCost: 8, runtimeMs: 40 },
    };
    const { rerender } = render(<PlaybackHarness results={results} />);

    expect(screen.getByTestId("algorithm")).toHaveTextContent("branchAndBound");
    expect(screen.getByTestId("segments")).toHaveTextContent("3");

    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("step")).toHaveTextContent("1");

    rerender(<PlaybackHarness results={{}} />);

    await waitFor(() => {
      expect(screen.getByTestId("segments")).toHaveTextContent("0");
      expect(screen.getByTestId("step")).toHaveTextContent("0");
    });
  });

  it("allows manual algorithm selection when a result exists", () => {
    render(
      <PlaybackHarness
        results={{
          greedy: { route: [0, 1, 0], totalCost: 10, runtimeMs: 2 },
          branchAndBound: { route: [0, 2, 1, 0], totalCost: 8, runtimeMs: 40 },
        }}
      />
    );

    fireEvent.click(screen.getByText("greedy"));
    expect(screen.getByTestId("algorithm")).toHaveTextContent("greedy");
  });
});
