# A* Notes

- A* solver is implemented with `f(n) = g(n) + h(n)`.
- API results include `path`, `totalCost`, `runtimeMs`, `visitedOrder`, `relaxedEdges`, and `traceSteps`.
- The backend scales the coordinate heuristic from graph edge weights to keep demo heuristics conservative.
- Tests compare A* result cost with Dijkstra on the same graph.
