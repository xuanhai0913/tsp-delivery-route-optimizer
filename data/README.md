# Data

Shared demo data for the TSP delivery-route optimizer.

This folder is for JSON cost matrices, location lists, and optional schemas used
by both backend tests and frontend demos.

## Planned Structure

```text
samples/
schemas/
```

## Data Shape

```ts
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
```

Cost matrices should be square numeric arrays where each index maps to one
location.

## Current Samples

- `samples/hcm-7.json`: 7-location Ho Chi Minh City demo route with coordinates for map visualization.

Dataset ids should use lowercase letters, numbers, and hyphens so the backend can safely expose them through `/api/datasets/:id`.
