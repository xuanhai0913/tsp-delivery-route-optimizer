# Frontend

React + Vite frontend for the TSP delivery-route demo.

This folder is intentionally a base structure only. Do not scaffold Vite or add
dependencies until the team starts frontend implementation.

## Planned Responsibilities

- Let users choose or enter delivery locations.
- Display the cost matrix.
- Call backend APIs for Greedy and Branch and Bound.
- Compare route, total cost, runtime, and notes.
- Visualize the selected route using Leaflet/OpenStreetMap or a graph view.

## Planned Structure

```text
src/
  api/
  components/
  pages/
  hooks/
  types/
  utils/
  styles/
  assets/
```

## Team Ownership

- Member 3 owns the main React UI and visualization flow.
- Member 1 and Member 2 provide backend response contracts to display.
- Member 4 provides demo scenarios and expected results.
