# RouteLab Group 1 Frontend

React + Vite + TypeScript frontend for the TSP classroom demo.

The app currently runs with mock data and a mock solver service so the UI can be
deployed before the backend APIs are ready.

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

`vercel.json` is included for the same defaults.

The repository root also includes a `vercel.json` that builds `frontend/` and
outputs `frontend/dist`, so deploying from the repo root is supported too.

## Screens

- Dashboard: dataset selector, algorithm controls, map/graph visualization, matrix, result cards.
- Dữ liệu: location editor, matrix editor, validation summary.
- Báo cáo: experiment snapshot, insights, route visualization, comparison table.
- Hướng dẫn: TSP, Greedy, and Branch and Bound explanation cards.

## Mock API Boundary

The frontend calls `src/services/solverClient.ts`.

When the backend is ready, replace the mock methods with HTTP calls while keeping
the same contract:

```ts
type SolveRequest = {
  start: number;
  costMatrix: number[][];
};

type SolveResult = {
  route: number[];
  totalCost: number;
  runtimeMs: number;
};
```
