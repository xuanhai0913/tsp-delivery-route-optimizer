import type pg from "pg";

import type { Dataset, DatasetSummary, GeoPoint, GraphEdge, GraphNode } from "../types/path.js";

type DatasetRow = {
  dataset_id: string;
  name: string;
  description: string | null;
  directed: boolean;
  default_source_node_id: number;
  default_target_node_id: number;
};

type DatasetSummaryRow = DatasetRow & {
  node_count: string | number;
  edge_count: string | number;
};

type GraphNodeRow = {
  node_id: number;
  name: string;
  lat: number;
  lng: number;
};

type GraphEdgeRow = {
  edge_id: string;
  from_node_id: number;
  to_node_id: number;
  weight: number;
  label: string | null;
  geometry: unknown;
};

function isGeoPoint(value: unknown): value is GeoPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const point = value as Partial<GeoPoint>;

  return (
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng)
  );
}

export function parseEdgeGeometry(geometry: unknown, edgeId: string): GeoPoint[] | undefined {
  if (geometry === null || geometry === undefined) {
    return undefined;
  }

  let parsedGeometry: unknown = geometry;

  if (typeof geometry === "string") {
    try {
      parsedGeometry = JSON.parse(geometry) as unknown;
    } catch {
      throw new Error(`Invalid geometry for edge ${edgeId}: JSON string is malformed.`);
    }
  }

  if (!Array.isArray(parsedGeometry)) {
    throw new Error(`Invalid geometry for edge ${edgeId}: expected an array of geo points.`);
  }

  if (parsedGeometry.length < 2) {
    throw new Error(`Invalid geometry for edge ${edgeId}: expected at least 2 points.`);
  }

  if (!parsedGeometry.every(isGeoPoint)) {
    throw new Error(`Invalid geometry for edge ${edgeId}: every point must include finite lat and lng.`);
  }

  return parsedGeometry;
}

function toEdge(row: GraphEdgeRow): GraphEdge {
  const geometry = parseEdgeGeometry(row.geometry, row.edge_id);

  return {
    id: row.edge_id,
    from: row.from_node_id,
    to: row.to_node_id,
    weight: row.weight,
    ...(row.label ? { label: row.label } : {}),
    ...(geometry ? { geometry } : {})
  };
}

function toNode(row: GraphNodeRow): GraphNode {
  return {
    id: row.node_id,
    name: row.name,
    lat: row.lat,
    lng: row.lng
  };
}

function parseDatabaseCount(value: string | number): number {
  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}

export async function listDatasetSummariesFromDatabase(pool: pg.Pool): Promise<DatasetSummary[]> {
  const result = await pool.query<DatasetSummaryRow>(`
    SELECT
      d.dataset_id,
      d.name,
      d.description,
      d.directed,
      d.default_source_node_id,
      d.default_target_node_id,
      COUNT(DISTINCT n.node_id) AS node_count,
      COUNT(DISTINCT e.edge_id) AS edge_count
    FROM path_datasets d
    LEFT JOIN graph_nodes n ON n.dataset_id = d.dataset_id
    LEFT JOIN graph_edges e ON e.dataset_id = d.dataset_id
    GROUP BY d.dataset_id
    ORDER BY d.dataset_id;
  `);

  return result.rows.map((row) => ({
    id: row.dataset_id,
    name: row.name,
    nodeCount: parseDatabaseCount(row.node_count),
    edgeCount: parseDatabaseCount(row.edge_count),
    defaultSource: row.default_source_node_id,
    defaultTarget: row.default_target_node_id
  }));
}

export async function getDatasetFromDatabase(pool: pg.Pool, id: string): Promise<Dataset | null> {
  const datasetResult = await pool.query<DatasetRow>(
    `
      SELECT
        dataset_id,
        name,
        description,
        directed,
        default_source_node_id,
        default_target_node_id
      FROM path_datasets
      WHERE dataset_id = $1;
    `,
    [id]
  );

  const dataset = datasetResult.rows[0];

  if (!dataset) {
    return null;
  }

  const [nodesResult, edgesResult] = await Promise.all([
    pool.query<GraphNodeRow>(
      `
        SELECT node_id, name, lat, lng
        FROM graph_nodes
        WHERE dataset_id = $1
        ORDER BY node_id;
      `,
      [id]
    ),
    pool.query<GraphEdgeRow>(
      `
        SELECT edge_id, from_node_id, to_node_id, weight, label, geometry
        FROM graph_edges
        WHERE dataset_id = $1
        ORDER BY edge_id;
      `,
      [id]
    )
  ]);

  return {
    id: dataset.dataset_id,
    name: dataset.name,
    ...(dataset.description ? { description: dataset.description } : {}),
    directed: dataset.directed,
    defaultSource: dataset.default_source_node_id,
    defaultTarget: dataset.default_target_node_id,
    nodes: nodesResult.rows.map(toNode),
    edges: edgesResult.rows.map(toEdge)
  };
}
