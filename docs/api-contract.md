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

type Dataset = {
  id: string;
  name: string;
  locations: Location[];
  costMatrix: number[][];
  defaultStart: number;
};

type DatasetSummary = {
  id: string;
  name: string;
  locationCount: number;
  defaultStart: number;
};
```

## GET `/api/datasets`

Returns demo datasets that the frontend can show in the dataset selector.

### Response

```json
{
  "datasets": [
    {
      "id": "hcm-7",
      "name": "Ho Chi Minh City demo route",
      "locationCount": 7,
      "defaultStart": 0
    }
  ]
}
```

## GET `/api/datasets/:id`

Returns one full dataset with locations, coordinates, default start index, and cost matrix.

### Response

```json
{
  "id": "hcm-7",
  "name": "Ho Chi Minh City demo route",
  "defaultStart": 0,
  "locations": [
    {
      "id": 0,
      "name": "Central Post Office",
      "lat": 10.7798,
      "lng": 106.699
    },
    {
      "id": 1,
      "name": "Ben Thanh Market",
      "lat": 10.7725,
      "lng": 106.698
    }
  ],
  "costMatrix": [[0, 6], [6, 0]]
}
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
- Dataset ids use lowercase letters, numbers, and hyphens.
- Dataset `locations.length` must match `costMatrix.length`.
