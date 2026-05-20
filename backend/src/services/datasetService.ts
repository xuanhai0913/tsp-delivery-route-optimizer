import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { Dataset, DatasetSummary, Location, ValidationIssue } from "../types/tsp.js";
import { validateSolveRequest } from "../validators/solveRequestValidator.js";

const DATASET_ID_PATTERN = /^[a-z0-9-]+$/;

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

function isLocation(value: unknown): value is Location {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const location = value as Partial<Location>;
  const hasValidCoordinates =
    (location.lat === undefined || typeof location.lat === "number") &&
    (location.lng === undefined || typeof location.lng === "number");

  return Number.isInteger(location.id) && typeof location.name === "string" && location.name.length > 0 && hasValidCoordinates;
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

  if (!Array.isArray(dataset.locations) || dataset.locations.length === 0) {
    issues.push({
      code: "dataset-locations-invalid",
      message: "Dataset locations must be a non-empty array."
    });
  } else if (!dataset.locations.every(isLocation)) {
    issues.push({
      code: "dataset-location-invalid",
      message: "Each dataset location must include id and name."
    });
  }

  if (Array.isArray(dataset.locations)) {
    const ids = new Set(dataset.locations.map((location) => location.id));
    if (ids.size !== dataset.locations.length) {
      issues.push({
        code: "dataset-location-ids-duplicate",
        message: "Dataset location ids must be unique."
      });
    }
  }

  issues.push(
    ...validateSolveRequest({
      start: dataset.defaultStart,
      costMatrix: dataset.costMatrix
    })
  );

  if (
    Array.isArray(dataset.locations) &&
    Array.isArray(dataset.costMatrix) &&
    dataset.locations.length !== dataset.costMatrix.length
  ) {
    issues.push({
      code: "dataset-size-mismatch",
      message: "Location count must match cost matrix size."
    });
  }

  return issues;
}

function toSummary(dataset: Dataset): DatasetSummary {
  return {
    id: dataset.id,
    name: dataset.name,
    locationCount: dataset.locations.length,
    defaultStart: dataset.defaultStart
  };
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

  const samplesDirectory = await getSamplesDirectory();
  const filePath = path.join(samplesDirectory, `${id}.json`);

  if (!(await pathExists(filePath))) {
    return null;
  }

  return readDatasetFile(filePath);
}
