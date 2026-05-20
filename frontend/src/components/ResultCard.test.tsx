import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { ResultCard } from "./ResultCard";

describe("ResultCard", () => {
  it("renders route sequence and metrics", () => {
    render(
      <ResultCard
        algorithm="greedy"
        locations={mockDatasets[0].locations}
        result={{ route: [0, 1, 0], totalCost: 8.4, runtimeMs: 2.1 }}
      />
    );

    expect(screen.getByText(/Greedy/i)).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
    expect(screen.getByText("2 ms")).toBeInTheDocument();
  });

  it("highlights the active playback chip", () => {
    render(
      <ResultCard
        algorithm="greedy"
        locations={mockDatasets[0].locations}
        result={{ route: [0, 1, 2, 0], totalCost: 12, runtimeMs: 2 }}
        activeStep={1}
        isPlaybackTarget
      />
    );

    expect(screen.getAllByText("2")[0]).toHaveClass("active");
  });
});
