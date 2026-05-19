# Backend

Node.js + Express backend for solving the TSP delivery-route problem.

This folder contains the backend TypeScript test harness for algorithm work.
Runtime Express APIs are still planned, but backend CI is already available for
validators, route utilities, and future Greedy / Branch and Bound tests.

## Planned Responsibilities

- Read and validate cost matrix input.
- Expose solving APIs under `/api/solve`.
- Run Greedy nearest-neighbor and Branch and Bound algorithms.
- Return route, total cost, and runtime in milliseconds.

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
npm run typecheck
npm run test
```

GitHub Actions runs the same checks in `Backend Algorithm CI` whenever a PR or
push touches `backend/**`, `data/**`, or the backend workflow file.
