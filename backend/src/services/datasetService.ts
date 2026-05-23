import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { getDatabasePool } from "../db/pool.js";
import { getDatasetFromDatabase, listDatasetSummariesFromDatabase } from "../db/datasetRepository.js";
import type { Dataset, DatasetSummary, GraphEdge, GraphNode, ValidationIssue } from "../types/path.js";
import { validateSolveRequest } from "../validators/solveRequestValidator.js";

const DATASET_ID_PATTERN = /^[a-z0-9-]+$/;
const DATASET_DATABASE_UNAVAILABLE_MESSAGE =
  "Dataset database is unavailable. Check DATABASE_URL or DATABASE_PUBLIC_URL.";

export class DatasetDatabaseUnavailableError extends Error {
  public readonly status = 503;

  constructor(message = DATASET_DATABASE_UNAVAILABLE_MESSAGE, options?: ErrorOptions) {
    super(message, options);
    this.name = "DatasetDatabaseUnavailableError";
  }
}

async function pathExists(directoryPath: string): Promise<boolean> {
  try {
    await access(directoryPath);
    return true;
  } catch {
    return false;
  }
}

async function getSamplesDirectory(): Promise<string> {
  const candidates = [
    process.env.ROUTELAB_DATA_DIR,
    path.resolve(process.cwd(), "../data/samples"),
    path.resolve(process.cwd(), "data/samples")
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Dataset samples directory was not found.");
}

function isGraphNode(value: unknown): value is GraphNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Partial<GraphNode>;
  return (
    Number.isInteger(node.id) &&
    typeof node.name === "string" &&
    node.name.length > 0 &&
    typeof node.lat === "number" &&
    typeof node.lng === "number"
  );
}

function isGraphEdge(value: unknown): value is GraphEdge {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const edge = value as Partial<GraphEdge>;
  return (
    typeof edge.id === "string" &&
    edge.id.length > 0 &&
    Number.isInteger(edge.from) &&
    Number.isInteger(edge.to) &&
    typeof edge.weight === "number" &&
    Number.isFinite(edge.weight) &&
    edge.weight >= 0
  );
}

function validateDataset(dataset: Partial<Dataset>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!dataset.id || !DATASET_ID_PATTERN.test(dataset.id)) {
    issues.push({
      code: "dataset-id-invalid",
      message: "Dataset id must use lowercase letters, numbers, and hyphens."
    });
  }

  if (!dataset.name || typeof dataset.name !== "string") {
    issues.push({
      code: "dataset-name-invalid",
      message: "Dataset name must be a non-empty string."
    });
  }

  if (typeof dataset.directed !== "boolean") {
    issues.push({
      code: "dataset-directed-invalid",
      message: "Dataset directed flag must be boolean."
    });
  }

  if (!Array.isArray(dataset.nodes) || dataset.nodes.length === 0 || !dataset.nodes.every(isGraphNode)) {
    issues.push({
      code: "dataset-nodes-invalid",
      message: "Dataset nodes must include id, name, lat, and lng."
    });
  }

  if (!Array.isArray(dataset.edges) || dataset.edges.length === 0 || !dataset.edges.every(isGraphEdge)) {
    issues.push({
      code: "dataset-edges-invalid",
      message: "Dataset edges must include id, from, to, and weight."
    });
  }

  issues.push(
    ...validateSolveRequest({
      source: dataset.defaultSource,
      target: dataset.defaultTarget,
      nodes: dataset.nodes,
      edges: dataset.edges,
      directed: dataset.directed
    })
  );

  return issues;
}

function toSummary(dataset: Dataset): DatasetSummary {
  return {
    id: dataset.id,
    name: dataset.name,
    nodeCount: dataset.nodes.length,
    edgeCount: dataset.edges.length,
    defaultSource: dataset.defaultSource,
    defaultTarget: dataset.defaultTarget
  };
}

function getDatasetSource(): "auto" | "database" | "json" {
  const configuredSource = process.env.DATASET_SOURCE?.toLowerCase();

  if (configuredSource === "database" || configuredSource === "json") {
    return configuredSource;
  }

  return "auto";
}

function getConfiguredDatabasePool() {
  const pool = getDatabasePool();

  if (!pool && getDatasetSource() === "database") {
    throw new DatasetDatabaseUnavailableError();
  }

  return pool;
}

function logDatabaseFallback(error: unknown): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Dataset database read failed; falling back to JSON samples. ${message}`);
}

async function readDatasetFile(filePath: string): Promise<Dataset> {
  const content = await readFile(filePath, "utf8");
  const dataset = JSON.parse(content) as Partial<Dataset>;
  const issues = validateDataset(dataset);

  if (issues.length > 0) {
    const detail = issues.map((issue) => issue.code).join(", ");
    throw new Error(`Invalid dataset file ${path.basename(filePath)}: ${detail}`);
  }

  return dataset as Dataset;
}

export async function listDatasets(): Promise<DatasetSummary[]> {
  const datasetSource = getDatasetSource();
  const pool = datasetSource === "json" ? null : getConfiguredDatabasePool();

  if (pool) {
    try {
      const summaries = await listDatasetSummariesFromDatabase(pool);

      if (summaries.length > 0 || datasetSource === "database") {
        return summaries;
      }
    } catch (error) {
      if (datasetSource === "database") {
        throw new DatasetDatabaseUnavailableError(undefined, { cause: error });
      }

      logDatabaseFallback(error);
    }
  }

  const samplesDirectory = await getSamplesDirectory();
  const files = (await readdir(samplesDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  const datasets = await Promise.all(files.map((fileName) => readDatasetFile(path.join(samplesDirectory, fileName))));

  return datasets.map(toSummary);
}

export async function getDatasetById(id: string): Promise<Dataset | null> {
  if (!DATASET_ID_PATTERN.test(id)) {
    return null;
  }

  const datasetSource = getDatasetSource();
  const pool = datasetSource === "json" ? null : getConfiguredDatabasePool();

  if (pool) {
    try {
      const dataset = await getDatasetFromDatabase(pool, id);

      if (dataset || datasetSource === "database") {
        return dataset;
      }
    } catch (error) {
      if (datasetSource === "database") {
        throw new DatasetDatabaseUnavailableError(undefined, { cause: error });
      }

      logDatabaseFallback(error);
    }
  }

  const samplesDirectory = await getSamplesDirectory();
  const filePath = path.join(samplesDirectory, `${id}.json`);

  if (!(await pathExists(filePath))) {
    return null;
  }

  return readDatasetFile(filePath);
}
