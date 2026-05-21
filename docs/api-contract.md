# API Contract

Planned backend API endpoints for the RouteLab shortest-path demo.

## Shared Types

```ts
type GraphNode = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

type GeoPoint = {
  lat: number;
  lng: number;
};

type GraphEdge = {
  id: string;
  from: number;
  to: number;
  weight: number;
  label?: string;
  geometry?: GeoPoint[];
};

type PathDataset = {
  id: string;
  name: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  defaultSource: number;
  defaultTarget: number;
};

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

type QueueEntry = {
  node: number;
  priority: number;
  cost: number;
  heuristic?: number;
};

type NodeMetric = {
  node: number;
  status: "unvisited" | "queued" | "visited" | "current" | "path";
  distance?: number;
  previous?: number;
  gCost?: number;
  hCost?: number;
  fCost?: number;
};

type AlgorithmTraceStep = {
  stepIndex: number;
  phase: "select-current" | "relax-edge" | "final-path";
  currentNode?: number;
  relaxedEdge?: {
    id?: string;
    from: number;
    to: number;
    weight: number;
    cumulativeCost: number;
  };
  queue: QueueEntry[];
  nodes: NodeMetric[];
  message: string;
};
```

## GET `/api/datasets`

Returns demo graph datasets that the frontend can show in the dataset selector.

```json
{
  "datasets": [
    {
      "id": "hcm-7",
      "name": "Ho Chi Minh City shortest-path graph",
      "nodeCount": 7,
      "edgeCount": 12,
      "defaultSource": 1,
      "defaultTarget": 6
    }
  ]
}
```

## GET `/api/datasets/:id`

Returns one full graph dataset with nodes, coordinates, weighted edges, and default source/target.

## POST `/api/solve/dijkstra`

Runs the Dijkstra shortest-path strategy.

### Request

```json
{
  "source": 1,
  "target": 6,
  "directed": false,
  "nodes": [
    { "id": 1, "name": "Ben Thanh Market", "lat": 10.7725, "lng": 106.698 },
    { "id": 6, "name": "Saigon Zoo", "lat": 10.7866, "lng": 106.7057 }
  ],
  "edges": [
    {
      "id": "e1-2",
      "from": 1,
      "to": 2,
      "weight": 2.5,
      "geometry": [
        { "lat": 10.7725, "lng": 106.698 },
        { "lat": 10.7738, "lng": 106.6967 },
        { "lat": 10.777, "lng": 106.6953 }
      ]
    }
  ]
}
```

### Response

Backend solver implementation is pending in the migration commit, so valid requests currently return:

```json
{
  "error": "Shortest-path solver is not implemented yet.",
  "algorithm": "dijkstra"
}
```

Final solver response will be:

```json
{
  "path": [1, 2, 3, 6],
  "totalCost": 7.5,
  "runtimeMs": 0.18,
  "visitedOrder": [1, 2, 5, 3, 6],
  "relaxedEdges": [
    { "from": 1, "to": 2, "cumulativeCost": 2.5 }
  ],
  "traceSteps": [
    {
      "stepIndex": 0,
      "phase": "select-current",
      "currentNode": 1,
      "queue": [],
      "nodes": [
        { "node": 1, "status": "current", "distance": 0 }
      ],
      "message": "Chọn node 1 vì có dist nhỏ nhất."
    }
  ]
}
```

## POST `/api/solve/a-star`

Runs the A* shortest-path strategy using a coordinate heuristic.

Request and final response shape match `POST /api/solve/dijkstra`.

## Validation Direction

- `source` and `target` must be integer node ids that exist in `nodes`.
- `source` and `target` should be different for the demo.
- `nodes` must include unique ids, names, lat, and lng.
- `edges` must reference existing nodes and use finite non-negative weights.
- `geometry` is optional; when present it must contain at least two finite lat/lng points.
- `traceSteps` is optional but recommended for algorithm replay UI.
- Dataset ids use lowercase letters, numbers, and hyphens.
