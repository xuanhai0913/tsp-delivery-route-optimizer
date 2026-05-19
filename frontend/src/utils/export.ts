import type { Dataset, SolverState } from "../types/tsp";

export function downloadJson(dataset: Dataset, start: number, results: SolverState): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    dataset,
    start,
    results,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tsp-results-${dataset.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportElementToPng(element: HTMLElement, fileName: string): Promise<void> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#f3f6fb",
  });

  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = dataUrl;
  anchor.click();
}
