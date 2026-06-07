# Algorithm Notes

Nguồn học thuật chính thống cho bốn thuật toán được gom tại
[references.md](references.md). Khi viết báo cáo/slide, ưu tiên trích các paper
gốc trong file đó.

## Dijkstra

- Solves single-source shortest path on graphs with non-negative edge weights.
- Primary source: Dijkstra (1959), DOI `10.1007/BF01386390`.
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
- Primary source: Hart, Nilsson, and Raphael (1968), DOI `10.1109/TSSC.1968.300136`.
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

## Bellman-Ford

- Solves single-source shortest path like Dijkstra, but by repeatedly relaxing every edge.
- Primary sources: Bellman (1958), DOI `10.1090/qam/102435`; Ford (1956), RAND Paper P-923.
- Can handle negative edge weights in theory.
- Can detect negative-weight cycles, which makes it useful as a contrast to Dijkstra/A*.
- In RouteLab, Bellman-Ford should use the same `PathSolveResult` contract so the UI can replay relaxation rounds.

```text
dist[source] = 0

repeat V - 1 times:
  for each edge (u, v, weight):
    if dist[u] + weight < dist[v]:
      dist[v] = dist[u] + weight
      previous[v] = u

for each edge:
  if it can still be relaxed:
    report negative cycle

reconstruct path from previous map
```

- Time complexity: `O(VE)`.
- Strong teaching point: it is slower than Dijkstra on non-negative road graphs,
  but more general because it explains repeated relaxation and negative-cycle detection.

## Floyd-Warshall

- Solves all-pairs shortest path using dynamic programming.
- Primary sources: Floyd (1962), DOI `10.1145/367766.368168`; Warshall (1962), DOI `10.1145/321105.321107`.
- Instead of one source, it computes shortest paths between every pair of nodes.
- Best for small graphs, which matches the 5-10 node classroom demo.

```text
dist[i][j] = direct edge cost from i to j
next[i][j] = j if direct edge exists

for each intermediate node k:
  for each source i:
    for each target j:
      if dist[i][k] + dist[k][j] < dist[i][j]:
        dist[i][j] = dist[i][k] + dist[k][j]
        next[i][j] = next[i][k]

reconstruct path source -> target using next matrix
```

- Time complexity: `O(V^3)`.
- Strong teaching point: it is easy to explain with a matrix/table and is useful
  when the system needs many source-target queries.

## Demo Comparison

| Criteria | Dijkstra | A* | Bellman-Ford | Floyd-Warshall |
| --- | --- | --- | --- | --- |
| Problem type | Single-source to target | Single-source to target | Single-source to target | All-pairs, then extract source-target |
| Extra information | None | Heuristic distance to target | None | Distance matrix |
| Weight support | Non-negative | Non-negative with admissible heuristic | Can handle negative edges | Can handle negative edges if no negative cycle |
| Complexity | `O((V + E) log V)` | Worst-case near Dijkstra | `O(VE)` | `O(V^3)` |
| Visualization | Expanding visited frontier | Directed search toward target | Repeated relaxation rounds | Matrix updates by intermediate node |
