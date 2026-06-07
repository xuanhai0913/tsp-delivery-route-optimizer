# RouteLab Database Design

Backend uses PostgreSQL for graph datasets and future solver run history.

## Tables

### `path_datasets`

Stores one graph dataset.

| Column | Type | Notes |
| --- | --- | --- |
| `dataset_id` | `text` | Primary key, lowercase slug such as `hcm-7`. |
| `name` | `text` | Display name. |
| `description` | `text` | Optional summary. |
| `directed` | `boolean` | Whether graph edges are directed. |
| `default_source_node_id` | `integer` | Default source node. |
| `default_target_node_id` | `integer` | Default target node. |
| `created_at`, `updated_at` | `timestamptz` | Audit timestamps. |

`default_source_node_id` and `default_target_node_id` reference `graph_nodes`.
The constraints are deferrable so seed scripts can insert dataset metadata and nodes in one transaction.

### `graph_nodes`

Stores graph vertices.

Primary key: `(dataset_id, node_id)`.

| Column | Type | Notes |
| --- | --- | --- |
| `dataset_id` | `text` | FK to `path_datasets`. |
| `node_id` | `integer` | Stable node id used by API algorithms. |
| `name` | `text` | Place/node name. |
| `lat`, `lng` | `double precision` | Coordinates for map and A* heuristic. |

### `graph_edges`

Stores weighted graph edges.

Primary key: `(dataset_id, edge_id)`.

| Column | Type | Notes |
| --- | --- | --- |
| `dataset_id` | `text` | Dataset owner. |
| `edge_id` | `text` | Stable edge id. |
| `from_node_id`, `to_node_id` | `integer` | FK to nodes in the same dataset. |
| `weight` | `double precision` | Non-negative cost. |
| `label` | `text` | Optional road/street label. |
| `geometry` | `jsonb` | Optional `[{ "lat": number, "lng": number }]` polyline. |

Indexes exist on `(dataset_id, from_node_id)` and `(dataset_id, to_node_id)` for graph traversal.

### `solver_runs`

Reserved for saving shortest-path experiment output later.

| Column | Type | Notes |
| --- | --- | --- |
| `run_id` | `bigint generated always as identity` | Primary key. |
| `dataset_id` | `text` | Optional FK to dataset. |
| `algorithm` | `text` | `dijkstra`, `a-star`, `bellman-ford`, or `floyd-warshall`. |
| `source_node_id`, `target_node_id` | `integer` | Request endpoints. |
| `path` | `integer[]` | Result path. |
| `total_cost`, `runtime_ms` | `double precision` | Metrics. |
| `visited_order` | `integer[]` | Optional explored order. |
| `trace_steps` | `jsonb` | Optional replay trace. |

## Environment

Use one of:

```bash
DATABASE_URL=postgresql://...
DATABASE_PUBLIC_URL=postgresql://...
```

`DATABASE_URL` is preferred. `DATABASE_PUBLIC_URL` is accepted for Railway-style public proxy URLs.

SSL behavior:

```bash
DATABASE_SSL=true   # force SSL with rejectUnauthorized=false
DATABASE_SSL=false  # force no SSL
```

If neither is set, `/health/db` returns `not-configured` and datasets fall back to JSON samples.

## Commands

```bash
cd backend
npm run db:migrate
npm run db:seed
```

or:

```bash
cd backend
npm run db:setup
```

`db:seed` imports datasets from `data/samples/*.json`, including road geometry.

## Dataset Source Mode

By default, backend uses `DATASET_SOURCE=auto` behavior:

1. If a database URL exists and DB has datasets, read from PostgreSQL.
2. If DB is missing, empty, or not migrated, fall back to JSON samples.

Override when needed:

```bash
DATASET_SOURCE=database # require PostgreSQL and fail if unavailable
DATASET_SOURCE=json     # force local JSON samples
```
