import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildComparisonRows } from "../utils/route";
import { ComparisonTable } from "./ComparisonTable";

describe("ComparisonTable", () => {
  it("highlights best cost and fastest runtime", () => {
    const rows = buildComparisonRows({
      dijkstra: { path: [0, 1, 2], totalCost: 9, runtimeMs: 8, visitedOrder: [0, 1, 2] },
      aStar: { path: [0, 1, 2], totalCost: 9, runtimeMs: 5, visitedOrder: [0, 2] },
    });

    render(<ComparisonTable rows={rows} />);

    expect(screen.getAllByText("Ngắn nhất")).toHaveLength(2);
    expect(screen.getByText("Nhanh nhất")).toBeInTheDocument();
    expect(screen.getAllByText("0 → 1 → 2")[0]).toBeInTheDocument();
  });
});
