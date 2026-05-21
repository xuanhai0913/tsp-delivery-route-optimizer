import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import type { SolverState } from "../types/path";
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
      <button type="button" onClick={() => playback.setSelectedAlgorithm("dijkstra")}>
        dijkstra
      </button>
    </div>
  );
}

describe("useRoutePlayback", () => {
  it("prefers A* results and resets when results clear", async () => {
    const results: SolverState = {
      dijkstra: { path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 8 },
      aStar: { path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 5 },
    };
    const { rerender } = render(<PlaybackHarness results={results} />);

    expect(screen.getByTestId("algorithm")).toHaveTextContent("aStar");
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
          dijkstra: { path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 8 },
          aStar: { path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 5 },
        }}
      />
    );

    fireEvent.click(screen.getByText("dijkstra"));
    expect(screen.getByTestId("algorithm")).toHaveTextContent("dijkstra");
  });
});
