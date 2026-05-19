import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CostMatrixTable } from "./CostMatrixTable";

describe("CostMatrixTable", () => {
  it("renders matrix labels and diagonal cells", () => {
    render(
      <CostMatrixTable
        start={0}
        matrix={[
          [0, 4.2],
          [4.2, 0],
        ]}
      />
    );

    expect(screen.getByRole("table", { name: /ma trận chi phí/i })).toBeInTheDocument();
    expect(screen.getAllByText("0.0")).toHaveLength(2);
    expect(screen.getAllByText("4.2")).toHaveLength(2);
  });
});
