import { describe, expect, it } from "vitest";

import { getDatasetById, listDatasets } from "./datasetService.js";

describe("datasetService", () => {
  it("lists available shortest-path graph datasets", async () => {
    const datasets = await listDatasets();

    expect(datasets).toContainEqual({
      id: "hcm-7",
      name: "Ho Chi Minh City shortest-path graph",
      nodeCount: 7,
      edgeCount: 12,
      defaultSource: 1,
      defaultTarget: 6
    });
  });

  it("loads a dataset with nodes and weighted edges", async () => {
    const dataset = await getDatasetById("hcm-7");

    expect(dataset).not.toBeNull();
    expect(dataset?.nodes).toHaveLength(7);
    expect(dataset?.edges).toHaveLength(12);
    expect(dataset?.directed).toBe(false);
    expect(dataset?.nodes[0]).toMatchObject({
      id: 0,
      name: "Central Post Office"
    });
  });

  it("returns null for unknown or unsafe dataset ids", async () => {
    await expect(getDatasetById("unknown")).resolves.toBeNull();
    await expect(getDatasetById("../hcm-7")).resolves.toBeNull();
  });
});
