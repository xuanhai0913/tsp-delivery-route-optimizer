import "dotenv/config";

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { Dataset } from "../types/path.js";
import { closeDatabasePool, getDatabasePool } from "./pool.js";

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

async function readDatasets(): Promise<Dataset[]> {
  const samplesDirectory = await getSamplesDirectory();
  const files = (await readdir(samplesDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  return Promise.all(
    files.map(async (fileName) => {
      const content = await readFile(path.join(samplesDirectory, fileName), "utf8");
      return JSON.parse(content) as Dataset;
    })
  );
}

async function seedDatasets(): Promise<void> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required to seed datasets.");
  }

  for (const dataset of await readDatasets()) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SET CONSTRAINTS ALL DEFERRED");
      await client.query(
        `
          INSERT INTO path_datasets (
            dataset_id,
            name,
            description,
            directed,
            default_source_node_id,
            default_target_node_id,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, now())
          ON CONFLICT (dataset_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            directed = EXCLUDED.directed,
            default_source_node_id = EXCLUDED.default_source_node_id,
            default_target_node_id = EXCLUDED.default_target_node_id,
            updated_at = now();
        `,
        [
          dataset.id,
          dataset.name,
          dataset.description ?? null,
          dataset.directed,
          dataset.defaultSource,
          dataset.defaultTarget
        ]
      );

      await client.query("DELETE FROM graph_edges WHERE dataset_id = $1", [dataset.id]);
      await client.query("DELETE FROM graph_nodes WHERE dataset_id = $1", [dataset.id]);

      for (const node of dataset.nodes) {
        await client.query(
          `
            INSERT INTO graph_nodes (dataset_id, node_id, name, lat, lng, updated_at)
            VALUES ($1, $2, $3, $4, $5, now());
          `,
          [dataset.id, node.id, node.name, node.lat, node.lng]
        );
      }

      for (const edge of dataset.edges) {
        await client.query(
          `
            INSERT INTO graph_edges (
              dataset_id,
              edge_id,
              from_node_id,
              to_node_id,
              weight,
              label,
              geometry,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now());
          `,
          [
            dataset.id,
            edge.id,
            edge.from,
            edge.to,
            edge.weight,
            edge.label ?? null,
            edge.geometry ? JSON.stringify(edge.geometry) : null
          ]
        );
      }

      await client.query("COMMIT");
      console.log(`seeded ${dataset.id}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

seedDatasets()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
