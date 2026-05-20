# Backend

Node.js + Express backend for solving the TSP delivery-route problem.

This folder contains the backend TypeScript + Express API for algorithm work.
The service is prepared for Render deployment as `routelab-backend`.

## Responsibilities

- Read and validate cost matrix input.
- Expose solving APIs under `/api/solve`.
- Run Greedy nearest-neighbor and Branch and Bound algorithms.
- Return route, total cost, and runtime in milliseconds.

## API

```text
GET /health
GET /health/db
POST /api/solve/greedy
POST /api/solve/branch-and-bound
```

Solve request:

```json
{
  "start": 0,
  "costMatrix": [
    [0, 10, 15],
    [10, 0, 20],
    [15, 20, 0]
  ]
}
```

## Planned Structure

```text
src/
  algorithms/
    greedy/
    branch-and-bound/
  controllers/
  routes/
  services/
  validators/
  types/
  utils/
  tests/
```

## Team Ownership

- Member 1: `src/algorithms/greedy`, data handling, Greedy complexity notes.
- Member 2: `src/algorithms/branch-and-bound`, optimal solver, pruning notes.
- Member 3: consume backend APIs from frontend.
- Member 4: test cases and verification scenarios.

## TypeScript Direction

Shared backend contracts should follow these shapes:

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

## Local Checks

Run these commands before opening a PR that changes backend algorithms or shared
data:

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
Railway PostgreSQL is provided through `DATABASE_URL` as a Render secret.
Detailed setup notes are in `docs/backend-deploy-render.md`.
