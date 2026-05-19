# TSP Delivery Route Optimizer

React + Node.js project for a delivery-route optimization assignment. The app
compares a Greedy nearest-neighbor approach with Branch and Bound for the
Travelling Salesman Problem (TSP).

## Goal

Given a cost matrix between delivery locations, find and compare routes:

- Greedy nearest-neighbor route
- Branch and Bound optimal route
- Total cost for each method
- Runtime comparison
- Route visualization on a map or graph

## Suggested Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Map/UI: Leaflet + OpenStreetMap
- Data format: JSON cost matrix
- Algorithms: JavaScript or TypeScript implementation in the backend

## Team Split

- Member 1: Greedy algorithm and input data handling
- Member 2: Branch and Bound algorithm and complexity analysis
- Member 3: React UI, map visualization, and result display
- Member 4: Test cases, report, slides, and demo script

## Project Scope

- Demo with 5-10 locations
- Start from one selected location
- Visit every location exactly once
- Return to the start location
- Compare route quality and execution time
