# Test Cases

## Backend

- Valid graph dataset loads with nodes, edges, default source, and default target.
- Invalid dataset id returns `404` or `null` service result.
- Valid solve request reaches `/api/solve/dijkstra` and returns `501` until solver implementation lands.
- Valid solve request reaches `/api/solve/a-star` and returns `501` until solver implementation lands.
- Invalid solve request rejects missing nodes, missing edges, invalid source/target, negative weights, and edge references to unknown nodes.

## Frontend

- Dashboard renders graph selector, source selector, target selector, Dijkstra/A* controls, and edge table.
- Mock Dijkstra result starts at source and ends at target.
- Mock A* result has the same total path cost as Dijkstra on the demo graph.
- Playback animates path from source to target without returning to source.
- Comparison table highlights best cost and fastest runtime.
- Data page validates node ids, edge weights, and edge references.

## Manual Demo

- Select HCM graph.
- Set source to `Chợ Bến Thành` and target to `Thảo Cầm Viên`.
- Run both algorithms.
- Switch between Map and Graph tabs.
- Explain visited nodes, relaxed edges, final path, total cost, and runtime.
