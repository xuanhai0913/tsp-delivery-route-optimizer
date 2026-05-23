import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDatasets } from "../data/mockDatasets";
import { datasetClient } from "./datasetClient";

const backendDataset = {
  id: "hcm-7",
  name: "Backend HCM",
  description: "Loaded from backend",
  directed: false,
  defaultSource: 1,
  defaultTarget: 6,
  nodes: [
    { id: 1, name: "Source", lat: 10, lng: 106 },
    { id: 6, name: "Target", lat: 10.1, lng: 106.1 },
  ],
  edges: [{ id: "e1-6", from: 1, to: 6, weight: 7.5 }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("datasetClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads dataset summaries and full graph data from the backend", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          datasets: [
            {
              id: "hcm-7",
              name: "Backend HCM",
              nodeCount: 2,
              edgeCount: 1,
              defaultSource: 1,
              defaultTarget: 6,
            },
          ],
        })
      )
      .mockResolvedValueOnce(jsonResponse(backendDataset));
    vi.stubGlobal("fetch", fetchMock);

    const result = await datasetClient.loadDatasets();

    expect(result.source).toBe("backend");
    expect(result.datasets).toEqual([backendDataset]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.test/api/datasets",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.test/api/datasets/hcm-7",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("falls back to mock datasets when the backend is unavailable", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await datasetClient.loadDatasets();

    expect(result.source).toBe("mock");
    expect(result.datasets).toBe(mockDatasets);
  });
});
