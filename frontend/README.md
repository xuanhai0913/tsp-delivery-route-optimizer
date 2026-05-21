# RouteLab Group 1 Frontend

React + Vite + TypeScript frontend for the shortest-path classroom demo.

The app currently runs with graph mock data and a mock solver service so the UI
can be deployed before the backend Dijkstra/A* solvers are ready.

## Production Domain

Frontend production URL: [maps.hailamdev.space](https://maps.hailamdev.space)

## Brand Assets

Favicons, app icons, and logo files live in `public/`.

- `public/favicon.svg`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/brand/logo-mark.svg`
- `public/brand/logo-horizontal.svg`
- `public/brand/og-image.png`

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Vercel

Use these Vercel project settings when deploying the frontend directly:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

The repository root also includes a `vercel.json` that builds `frontend/` and
outputs `frontend/dist`, so deploying from the repo root is supported too.

## Screens

- Dashboard: graph selector, source/target controls, Dijkstra/A* controls, map/graph visualization, result cards.
- Dữ liệu: node editor, edge editor, validation summary.
- Báo cáo: experiment snapshot, insights, path visualization, comparison table.
- Hướng dẫn: shortest path, Dijkstra, and A* explanation cards.

## Mock API Boundary

The frontend calls `src/services/solverClient.ts`.

When the backend is ready, replace the mock methods with HTTP calls while keeping
the same contract:

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

The mock client currently generates `traceSteps` for algorithm replay, including
priority queue snapshots, node metrics, relaxed edges, and the final path step.
`GraphEdge.geometry` is optional and lets the map draw road-like polylines
instead of straight node-to-node lines.
