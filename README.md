# RouteLab Group 1

<p align="center">
  <strong>Classroom route-optimization lab for comparing Greedy nearest-neighbor and Branch and Bound on TSP.</strong>
</p>

<p align="center">
  <img alt="Project status" src="https://img.shields.io/badge/status-frontend%20live-2f6f73?style=flat-square">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-4f46e5?style=flat-square">
  <img alt="Backend" src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express-111827?style=flat-square">
  <img alt="Demo scope" src="https://img.shields.io/badge/demo-5--10%20locations-d97706?style=flat-square">
</p>

<p align="center">
  <a href="https://maps.hailamdev.space">Live Frontend</a> ·
  <a href="#preview">Preview</a> ·
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#team-plan">Team Plan</a> ·
  <a href="docs/api-contract.md">API Contract</a>
</p>

## Live Frontend

Production frontend domain: [maps.hailamdev.space](https://maps.hailamdev.space)

The current frontend is deployed with mock data and a mock solver service while
the backend APIs are still being implemented.

## Preview

<img src="docs/assets/screenshots/dashboard.png" alt="Main solver dashboard" width="100%">

<table>
  <tr>
    <td width="50%">
      <img src="docs/assets/screenshots/custom-data-input.png" alt="Custom data input screen" width="100%">
    </td>
    <td width="50%">
      <img src="docs/assets/screenshots/algorithm-explanation.png" alt="Algorithm explanation screen" width="100%">
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="docs/assets/screenshots/experiment-summary.png" alt="Experiment summary screen" width="100%">
    </td>
  </tr>
</table>

## Overview

This project simulates a delivery route planner using the Travelling Salesman
Problem (TSP). Given a list of locations and a cost matrix, the app finds a tour
that starts from one location, visits every location exactly once, and returns to
the starting point.

The demo compares two strategies:

- **Greedy nearest-neighbor**: fast and simple, but not guaranteed to be optimal.
- **Branch and Bound**: finds the optimal route for small inputs, but becomes
  expensive as the number of locations grows.

## Features

| Area | Planned capability |
| --- | --- |
| Data input | Choose sample datasets or enter custom locations and cost matrix |
| Algorithms | Run Greedy and Branch and Bound from backend services |
| Comparison | Show route, total cost, runtime, and short algorithm notes |
| Visualization | Display route paths on a map or graph for presentation |
| Report support | Keep API contract, algorithm notes, test cases, and demo script in `docs/` |

## Architecture

```text
RouteLab Group 1/
  backend/   Node.js + Express API and TSP algorithms
  frontend/  React + Vite + TypeScript user interface
  data/      Sample locations and cost matrices
  docs/      API contract, algorithm notes, tests, report, slides
  tools/     Optional generators and validators
```

## API At A Glance

Planned endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/solve/greedy` | Run Greedy nearest-neighbor |
| `POST` | `/api/solve/branch-and-bound` | Run Branch and Bound optimal solver |

Shared response shape:

```ts
type SolveResult = {
  route: number[];
  totalCost: number;
  runtimeMs: number;
};
```

See [docs/api-contract.md](docs/api-contract.md) for the full request and
response contract.

## Team Plan

The project is split into 4 parallel workstreams from **19/05/2026** to
**06/07/2026**.

| Member | Focus | GitHub issue |
| --- | --- | --- |
| Member 1 | Data model, sample matrices, Greedy solver | [#1](https://github.com/xuanhai0913/tsp-delivery-route-optimizer/issues/1) |
| Member 2 | Branch and Bound optimal TSP solver | [#2](https://github.com/xuanhai0913/tsp-delivery-route-optimizer/issues/2) |
| Member 3 | React UI, API integration, route visualization | [#3](https://github.com/xuanhai0913/tsp-delivery-route-optimizer/issues/3) |
| Member 4 | Testing, report, slides, demo script | [#4](https://github.com/xuanhai0913/tsp-delivery-route-optimizer/issues/4) |

## Development Status

Current state:

- Repository skeleton is ready.
- UI design previews from Stitch are included in `docs/assets/screenshots/`.
- Frontend UI is implemented and available at [maps.hailamdev.space](https://maps.hailamdev.space).
- Frontend currently uses mock data and mock solver results until backend APIs are ready.
- Backend implementation has not started yet.

Next milestone:

1. Implement backend validation and solving APIs.
2. Replace the frontend mock solver client with HTTP API calls.
3. Add real sample datasets shared between backend and frontend.
4. Prepare final report screenshots from the production frontend domain.

## Documentation

- [API contract](docs/api-contract.md)
- [Algorithm notes](docs/algorithms.md)
- [Test cases](docs/test-cases.md)
- [Demo script](docs/demo-script.md)
- [Brand assets](docs/brand-assets.md)
- [Report outline](docs/report/README.md)
- [Slides outline](docs/slides/README.md)
