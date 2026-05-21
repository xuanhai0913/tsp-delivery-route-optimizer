import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { ResultCard } from "./ResultCard";

describe("ResultCard", () => {
  it("renders path sequence and metrics", () => {
    render(
      <ResultCard
        algorithm="dijkstra"
        nodes={mockDatasets[0].nodes}
        result={{ path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 8.4, visitedOrder: [1, 2, 5, 3, 6] }}
      />
    );

    expect(screen.getByText(/Dijkstra/i)).toBeInTheDocument();
    expect(screen.getByText("7.5")).toBeInTheDocument();
    expect(screen.getByText("8.4 ms")).toBeInTheDocument();
  });

  it("highlights the active playback chip", () => {
    render(
      <ResultCard
        algorithm="aStar"
        nodes={mockDatasets[0].nodes}
        result={{ path: [1, 2, 3, 6], totalCost: 7.5, runtimeMs: 5.7 }}
        activeStep={1}
        isPlaybackTarget
      />
    );

    expect(screen.getAllByText("3")[0]).toHaveClass("active");
  });
});
