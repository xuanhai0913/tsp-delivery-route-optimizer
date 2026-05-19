# Data

Shared demo data for the TSP delivery-route optimizer.

This folder is for JSON cost matrices, location lists, and optional schemas used
by both backend tests and frontend demos.

## Planned Structure

```text
samples/
schemas/
```

## Data Shape Direction

```ts
type Location = {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
};
```

Cost matrices should be square numeric arrays where each index maps to one
location.
