# Algorithms Notes

## Greedy Nearest-Neighbor

- Start at the selected location.
- At each step, choose the nearest unvisited location.
- Return to the start after every location has been visited once.
- Fast and simple, but does not guarantee the optimal route.
- Expected classroom complexity note: usually `O(n^2)`.

### Pseudocode

```text
route = [start]
visited = {start}
current = start

while visited.size < n:
  next = unvisited location with minimum costMatrix[current][location]
  add next to route and visited
  current = next

add start to route
return route and total route cost
```

### Complexity

- Time complexity: `O(n^2)` because each of the `n` route positions scans up to `n` candidate locations.
- Space complexity: `O(n)` for the visited set and returned route.
- Tie-break rule in this project: if two unvisited locations have the same cost, the smaller index is selected first. This keeps tests and demos deterministic.

### Notes For Demo

- Greedy is useful as a fast baseline and easy to explain in the presentation.
- Greedy can make a locally good choice that creates an expensive edge later, so it is not guaranteed to match the optimal Branch and Bound route.

## Branch and Bound

- Explore possible TSP routes as a search tree.
- Track current route, current cost, visited locations, and best known route.
- Cut branches that cannot beat the current best route.
- Finds the optimal route for small inputs, but becomes slow as `n` grows.
- Demo should use around 5-10 locations.
