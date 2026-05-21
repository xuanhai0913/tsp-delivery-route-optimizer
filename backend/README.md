# Backend

Node.js + Express backend for a shortest-path classroom demo.

The service is prepared for Render/Railway-style deployment as `routelab-backend`.

## Responsibilities

- Read and validate graph nodes and weighted edges.
- Expose dataset APIs under `/api/datasets`.
- Expose shortest-path solving APIs under `/api/solve`.
- Return `501 Not Implemented` for solver endpoints until Dijkstra/A* are implemented.

## API

```text
GET /health
GET /health/db
GET /api/datasets
GET /api/datasets/:id
POST /api/solve/dijkstra
POST /api/solve/a-star
```

Solve request:

```json
{
  "source": 1,
  "target": 6,
  "directed": false,
  "nodes": [{ "id": 1, "name": "Ben Thanh Market", "lat": 10.7725, "lng": 106.698 }],
  "edges": [{ "id": "e1-2", "from": 1, "to": 2, "weight": 2.5 }]
}
```

## Planned Structure

```text
src/
  algorithms/
    dijkstra/
    a-star/
  controllers/
  routes/
  services/
  validators/
  types/
  utils/
  tests/
```

## Team Ownership

- Member 1: graph data, request validation, Dijkstra implementation and complexity notes.
- Member 2: A* implementation, coordinate heuristic, correctness notes.
- Member 3: consume backend APIs from frontend.
- Member 4: test cases and verification scenarios.

## TypeScript Direction

Shared backend contracts should follow these shapes:

```ts
type PathSolveRequest = {
  source: number;
  target: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
};

type PathSolveResult = {
  path: number[];
  totalCost: number;
  runtimeMs: number;
  visitedOrder?: number[];
  relaxedEdges?: Array<{ from: number; to: number; cumulativeCost: number }>;
  traceSteps?: AlgorithmTraceStep[];
};
```

`GraphEdge.geometry` is optional and stores road-like polyline points for map
visualization. `traceSteps` is optional but should be returned by the real
Dijkstra/A* solver so the frontend can replay queue, relaxation, and node state.

## Local Checks

```bash
cd backend
npm ci
npm run ci
```

GitHub Actions runs the same checks in `Backend Algorithm CI` whenever a PR or
push touches `backend/**`, `data/**`, or the backend workflow file.

## Local Run

```bash
cd backend
npm ci
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Deployment

Render deployment is configured by `/render.yaml`.
Railway PostgreSQL is provided through `DATABASE_URL` as a deployment secret.
Detailed setup notes are in `docs/backend-deploy-render.md`.
