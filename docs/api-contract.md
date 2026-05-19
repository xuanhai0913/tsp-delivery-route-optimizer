# API Contract

Planned backend API endpoints for the TSP delivery-route optimizer.

## Shared Types

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

type Location = {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
};
```

## POST `/api/solve/greedy`

Runs the Greedy nearest-neighbor strategy.

### Request

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

### Response

```json
{
  "route": [0, 1, 2, 0],
  "totalCost": 45,
  "runtimeMs": 0.12
}
```

## POST `/api/solve/branch-and-bound`

Runs the Branch and Bound optimal TSP strategy.

### Request

Same shape as `POST /api/solve/greedy`.

### Response

Same shape as `POST /api/solve/greedy`, but `route` and `totalCost` represent
the optimal route found by Branch and Bound.

## Validation Direction

- `start` must be an integer index inside the matrix range.
- `costMatrix` must be a non-empty square numeric matrix.
- Demo scope should stay around 5-10 locations.
