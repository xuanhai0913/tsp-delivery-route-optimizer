import { afterEach, describe, expect, it } from "vitest";

import { DatasetDatabaseUnavailableError, getDatasetById, listDatasets } from "./datasetService.js";

const originalDatasetSource = process.env.DATASET_SOURCE;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalDatabasePublicUrl = process.env.DATABASE_PUBLIC_URL;

function restoreEnvValue(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

afterEach(() => {
  restoreEnvValue("DATASET_SOURCE", originalDatasetSource);
  restoreEnvValue("DATABASE_URL", originalDatabaseUrl);
  restoreEnvValue("DATABASE_PUBLIC_URL", originalDatabasePublicUrl);
});

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

  it("fails explicitly when database mode is required but no database URL is configured", async () => {
    process.env.DATASET_SOURCE = "database";
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_PUBLIC_URL;

    await expect(listDatasets()).rejects.toBeInstanceOf(DatasetDatabaseUnavailableError);
    await expect(getDatasetById("hcm-7")).rejects.toMatchObject({
      status: 503
    });
  });
});
