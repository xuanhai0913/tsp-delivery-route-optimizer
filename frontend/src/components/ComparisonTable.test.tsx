import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildComparisonRows } from "../utils/route";
import { ComparisonTable } from "./ComparisonTable";

describe("ComparisonTable", () => {
  it("highlights best cost and fastest runtime", () => {
    const rows = buildComparisonRows({
      greedy: { route: [0, 1, 0], totalCost: 20, runtimeMs: 2 },
      branchAndBound: { route: [0, 2, 1, 0], totalCost: 18, runtimeMs: 145 },
    });

    render(<ComparisonTable rows={rows} />);

    expect(screen.getByText("Ngắn nhất")).toBeInTheDocument();
    expect(screen.getByText("Nhanh nhất")).toBeInTheDocument();
  });
});
