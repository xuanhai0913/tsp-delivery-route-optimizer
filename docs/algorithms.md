# Algorithm Notes

## Dijkstra

- Solves single-source shortest path on graphs with non-negative edge weights.
- Maintains a distance table and predecessor map.
- Repeatedly selects the unvisited node with the smallest tentative distance.
- Relaxes outgoing edges to improve known distances.

```text
dist[source] = 0
push source into priority queue

while queue is not empty:
  current = node with smallest dist
  if current == target: stop
  for each neighbor:
    candidate = dist[current] + weight(current, neighbor)
    if candidate < dist[neighbor]:
      dist[neighbor] = candidate
      previous[neighbor] = current
      push/update neighbor

reconstruct path from previous map
```

- With a binary heap priority queue: `O((V + E) log V)`.
- Guarantees the shortest path if all edge weights are non-negative.

## A*

- Extends Dijkstra with a heuristic estimate to the target.
- Uses `f(n) = g(n) + h(n)`.
- `g(n)` is the known cost from source to `n`.
- `h(n)` estimates remaining cost from `n` to target.
- In this project, `h(n)` should use coordinate distance for map-like data.

```text
g[source] = 0
f[source] = h(source)
push source into priority queue

while queue is not empty:
  current = node with smallest f
  if current == target: stop
  for each neighbor:
    candidateG = g[current] + weight(current, neighbor)
    if candidateG < g[neighbor]:
      previous[neighbor] = current
      g[neighbor] = candidateG
      f[neighbor] = candidateG + h(neighbor)

reconstruct path from previous map
```

- Worst-case complexity can match Dijkstra, but a good heuristic usually reduces explored nodes.
- A* remains optimal when the heuristic is admissible and consistent.

## Demo Comparison

| Criteria | Dijkstra | A* |
| --- | --- | --- |
| Goal | Baseline shortest path | Guided shortest path |
| Extra information | None | Heuristic distance to target |
| Guarantee | Optimal for non-negative weights | Optimal when heuristic is admissible |
| Visualization | Expanding visited frontier | Directed search toward target |
