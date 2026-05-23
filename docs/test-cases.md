# Test Cases

## Backend

- Valid graph dataset loads with nodes, edges, default source, and default target.
- Invalid dataset id returns `404` or `null` service result.
- Valid solve request reaches `/api/solve/dijkstra` and returns path, total cost, runtime, visited nodes, and trace steps.
- Valid solve request reaches `/api/solve/a-star` and returns path, total cost, runtime, visited nodes, heuristic metrics, and trace steps.
- Invalid solve request rejects missing nodes, missing edges, invalid source/target, negative weights, and edge references to unknown nodes.

## Frontend

- App loads dataset summaries and full graph datasets from the backend API.
- App falls back to local graph fixtures when backend loading times out or fails.
- Solver client calls `/api/solve/dijkstra` and `/api/solve/a-star` with the current graph.
- Solver client falls back to local mock results only when fallback is enabled.
- Dashboard renders graph selector, source selector, target selector, Dijkstra/A* controls, and edge table.
- Dijkstra result starts at source and ends at target.
- A* result has the same total path cost as Dijkstra on the demo graph.
- Playback animates path from source to target without returning to source.
- Comparison table highlights best cost and fastest runtime.
- Data page validates node ids, edge weights, and edge references.

## Manual Demo

- Select HCM graph.
- Set source to `Ben Thanh Market` and target to `Saigon Zoo`.
- Run both algorithms.
- Switch between Map and Graph tabs.
- Explain visited nodes, relaxed edges, final path, total cost, and runtime.
- Confirm status text says the graph/results came from the backend. If fallback text appears, wait for Render to wake and run again.
