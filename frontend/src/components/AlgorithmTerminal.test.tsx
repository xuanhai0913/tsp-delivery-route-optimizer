import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlgorithmTerminal } from "./AlgorithmTerminal";

describe("AlgorithmTerminal", () => {
  it("renders logs and can clear them", async () => {
    const onClear = vi.fn();
    render(
      <AlgorithmTerminal
        logs={[
          { id: "1", tone: "command", message: "> POST /api/solve/dijkstra", timestamp: "08:00:00" },
          { id: "2", tone: "success", message: "✓ path: 1 → 2 → 6, cost 7.5", timestamp: "08:00:01" },
        ]}
        onClear={onClear}
      />
    );

    expect(screen.getByText("> POST /api/solve/dijkstra")).toBeInTheDocument();
    expect(screen.getByText("✓ path: 1 → 2 → 6, cost 7.5")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Xóa terminal log"));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
