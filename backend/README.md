# Backend

Node.js + Express backend for solving the TSP delivery-route problem.

This folder is intentionally a base structure only. Do not add dependencies or
runtime code here until the team starts backend implementation.

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
