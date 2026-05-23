CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS path_datasets (
  dataset_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  directed BOOLEAN NOT NULL DEFAULT false,
  default_source_node_id INTEGER NOT NULL,
  default_target_node_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT path_datasets_id_format
    CHECK (dataset_id ~ '^[a-z0-9-]+$'),
  CONSTRAINT path_datasets_distinct_defaults
    CHECK (default_source_node_id <> default_target_node_id)
);

CREATE TABLE IF NOT EXISTS graph_nodes (
  dataset_id TEXT NOT NULL
    REFERENCES path_datasets(dataset_id)
    ON DELETE CASCADE,
  node_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dataset_id, node_id),
  CONSTRAINT graph_nodes_lat_range CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT graph_nodes_lng_range CHECK (lng >= -180 AND lng <= 180)
);

CREATE TABLE IF NOT EXISTS graph_edges (
  dataset_id TEXT NOT NULL,
  edge_id TEXT NOT NULL,
  from_node_id INTEGER NOT NULL,
  to_node_id INTEGER NOT NULL,
  weight DOUBLE PRECISION NOT NULL,
  label TEXT,
  geometry JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dataset_id, edge_id),
  CONSTRAINT graph_edges_from_fk
    FOREIGN KEY (dataset_id, from_node_id)
    REFERENCES graph_nodes(dataset_id, node_id)
    ON DELETE CASCADE,
  CONSTRAINT graph_edges_to_fk
    FOREIGN KEY (dataset_id, to_node_id)
    REFERENCES graph_nodes(dataset_id, node_id)
    ON DELETE CASCADE,
  CONSTRAINT graph_edges_weight_non_negative CHECK (weight >= 0),
  CONSTRAINT graph_edges_not_self_loop CHECK (from_node_id <> to_node_id),
  CONSTRAINT graph_edges_geometry_array
    CHECK (geometry IS NULL OR jsonb_typeof(geometry) = 'array')
);

CREATE INDEX IF NOT EXISTS graph_edges_dataset_from_idx
  ON graph_edges (dataset_id, from_node_id);

CREATE INDEX IF NOT EXISTS graph_edges_dataset_to_idx
  ON graph_edges (dataset_id, to_node_id);

CREATE TABLE IF NOT EXISTS solver_runs (
  run_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_id TEXT
    REFERENCES path_datasets(dataset_id)
    ON DELETE SET NULL,
  algorithm TEXT NOT NULL
    CHECK (algorithm IN ('dijkstra', 'a-star')),
  source_node_id INTEGER NOT NULL,
  target_node_id INTEGER NOT NULL,
  path INTEGER[] NOT NULL DEFAULT '{}',
  total_cost DOUBLE PRECISION NOT NULL CHECK (total_cost >= 0),
  runtime_ms DOUBLE PRECISION NOT NULL CHECK (runtime_ms >= 0),
  visited_order INTEGER[] NOT NULL DEFAULT '{}',
  trace_steps JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT solver_runs_distinct_endpoints
    CHECK (source_node_id <> target_node_id),
  CONSTRAINT solver_runs_trace_array
    CHECK (trace_steps IS NULL OR jsonb_typeof(trace_steps) = 'array')
);

CREATE INDEX IF NOT EXISTS solver_runs_dataset_created_idx
  ON solver_runs (dataset_id, created_at DESC);

CREATE INDEX IF NOT EXISTS solver_runs_algorithm_created_idx
  ON solver_runs (algorithm, created_at DESC);

ALTER TABLE path_datasets
  DROP CONSTRAINT IF EXISTS path_datasets_default_source_fk;

ALTER TABLE path_datasets
  ADD CONSTRAINT path_datasets_default_source_fk
  FOREIGN KEY (dataset_id, default_source_node_id)
  REFERENCES graph_nodes(dataset_id, node_id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE path_datasets
  DROP CONSTRAINT IF EXISTS path_datasets_default_target_fk;

ALTER TABLE path_datasets
  ADD CONSTRAINT path_datasets_default_target_fk
  FOREIGN KEY (dataset_id, default_target_node_id)
  REFERENCES graph_nodes(dataset_id, node_id)
  DEFERRABLE INITIALLY DEFERRED;
