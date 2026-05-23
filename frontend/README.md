# RouteLab Group 1 Frontend

React + Vite + TypeScript frontend for the shortest-path classroom demo.

The app loads graph datasets and Dijkstra/A* results from the Render backend,
with local mock fallback when the backend is unavailable.

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

Environment variables:

```bash
# Local dev: leave empty to use the Vite /api proxy.
# Vercel: set to https://routelab-backend.onrender.com.
VITE_API_BASE_URL=
VITE_ENABLE_MOCK_FALLBACK=true
VITE_API_TIMEOUT_MS=30000
```

In local development, `vite.config.ts` proxies `/api` to the Render backend and
sets the allowed production Origin header. This keeps browser testing close to
production while avoiding localhost CORS noise.

## Screens

- Dashboard: graph selector, source/target controls, Dijkstra/A* controls, map/graph visualization, result cards.
- Dữ liệu: node editor, edge editor, validation summary.
- Báo cáo: experiment snapshot, insights, path visualization, comparison table.
- Hướng dẫn: shortest path, Dijkstra, and A* explanation cards.

## API Boundary

The frontend calls `src/services/datasetClient.ts` for graph data and
`src/services/solverClient.ts` for Dijkstra/A*. Both clients are API-first and
fall back to local mock data/results when configured.

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

The backend returns `traceSteps` for algorithm replay, including priority queue
snapshots, node metrics, relaxed edges, and the final path step. The mock fallback
keeps the same shape for offline demos.
`GraphEdge.geometry` is optional and lets the map draw road-like polylines
instead of straight node-to-node lines.
