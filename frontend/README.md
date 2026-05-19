# RouteLab Group 1 Frontend

React + Vite + TypeScript frontend for the TSP classroom demo.

The app currently runs with mock data and a mock solver service so the UI can be
deployed before the backend APIs are ready.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Vercel

Use these Vercel project settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

`vercel.json` is included for the same defaults.

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
