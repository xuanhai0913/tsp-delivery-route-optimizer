import { describe, expect, it } from "vitest";

import { getDatasetById, listDatasets } from "./datasetService.js";

describe("datasetService", () => {
  it("lists available demo datasets", async () => {
    const datasets = await listDatasets();

    expect(datasets).toContainEqual({
      id: "hcm-7",
      name: "Ho Chi Minh City demo route",
      locationCount: 7,
      defaultStart: 0
    });
  });

  it("loads a dataset with locations and a matching cost matrix", async () => {
    const dataset = await getDatasetById("hcm-7");

    expect(dataset).not.toBeNull();
    expect(dataset?.locations).toHaveLength(7);
    expect(dataset?.costMatrix).toHaveLength(7);
    expect(dataset?.costMatrix[0]).toHaveLength(7);
    expect(dataset?.locations[0]).toMatchObject({
      id: 0,
      name: "Central Post Office"
    });
  });

  it("returns null for unknown or unsafe dataset ids", async () => {
    await expect(getDatasetById("unknown")).resolves.toBeNull();
    await expect(getDatasetById("../hcm-7")).resolves.toBeNull();
  });
});
