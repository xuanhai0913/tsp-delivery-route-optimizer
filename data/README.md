# Data

Shared demo data for the shortest-path RouteLab project.

This folder is for JSON graph datasets used by backend tests and frontend demos.

## Planned Structure

```text
samples/
schemas/
```

## Data Shape

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
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  defaultSource: number;
  defaultTarget: number;
};
```

Edge weights must be finite, non-negative numbers. `geometry` is optional and stores the road-like polyline for a map edge; if it is missing, the frontend draws a straight line between `from` and `to`.

## Current Samples

- `samples/hcm-7.json`: 7-node Ho Chi Minh City graph with coordinates for map visualization.

Dataset ids should use lowercase letters, numbers, and hyphens so the backend can safely expose them through `/api/datasets/:id`.
