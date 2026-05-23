import { mockDatasets } from "../data/mockDatasets";
import type { Dataset, DatasetLoadSource, DatasetSummary } from "../types/path";
import { fetchApiJson, isMockFallbackEnabled } from "./apiConfig";

type DatasetSummariesResponse = {
  datasets: DatasetSummary[];
};

export type DatasetLoadResult = {
  datasets: Dataset[];
  source: DatasetLoadSource;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDatasetSummary(value: unknown): value is DatasetSummary {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const summary = value as Partial<DatasetSummary>;
  return (
    typeof summary.id === "string" &&
    summary.id.length > 0 &&
    typeof summary.name === "string" &&
    Number.isInteger(summary.nodeCount) &&
    Number.isInteger(summary.edgeCount) &&
    Number.isInteger(summary.defaultSource) &&
    Number.isInteger(summary.defaultTarget)
  );
}

function isDataset(value: unknown): value is Dataset {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dataset = value as Partial<Dataset>;
  return (
    typeof dataset.id === "string" &&
    typeof dataset.name === "string" &&
    Array.isArray(dataset.nodes) &&
    Array.isArray(dataset.edges) &&
    typeof dataset.directed === "boolean" &&
    Number.isInteger(dataset.defaultSource) &&
    Number.isInteger(dataset.defaultTarget) &&
    dataset.nodes.every(
      (node) =>
        Number.isInteger(node.id) &&
        typeof node.name === "string" &&
        isFiniteNumber(node.lat) &&
        isFiniteNumber(node.lng),
    ) &&
    dataset.edges.every(
      (edge) =>
        typeof edge.id === "string" &&
        Number.isInteger(edge.from) &&
        Number.isInteger(edge.to) &&
        isFiniteNumber(edge.weight),
    )
  );
}

async function fetchDatasetSummaries(): Promise<DatasetSummary[]> {
  const response = await fetchApiJson<DatasetSummariesResponse>("/api/datasets");

  if (!Array.isArray(response.datasets) || !response.datasets.every(isDatasetSummary)) {
    throw new Error("Backend dataset summaries response is invalid.");
  }

  return response.datasets;
}

async function fetchDatasetById(id: string): Promise<Dataset> {
  const dataset = await fetchApiJson<unknown>(`/api/datasets/${encodeURIComponent(id)}`);

  if (!isDataset(dataset)) {
    throw new Error(`Backend dataset ${id} response is invalid.`);
  }

  return {
    ...dataset,
    description: dataset.description ?? "",
  };
}

async function loadBackendDatasets(): Promise<Dataset[]> {
  const summaries = await fetchDatasetSummaries();
  const datasets = await Promise.all(summaries.map((summary) => fetchDatasetById(summary.id)));

  if (datasets.length === 0) {
    throw new Error("Backend did not return any datasets.");
  }

  return datasets;
}

export const datasetClient = {
  async loadDatasets(): Promise<DatasetLoadResult> {
    try {
      return {
        datasets: await loadBackendDatasets(),
        source: "backend",
      };
    } catch (error) {
      if (isMockFallbackEnabled()) {
        return { datasets: mockDatasets, source: "mock" };
      }

      throw error;
    }
  },
};
