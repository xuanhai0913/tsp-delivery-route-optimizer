# Algorithms Notes

## Greedy Nearest-Neighbor

- Start at the selected location.
- At each step, choose the nearest unvisited location.
- Return to the start after every location has been visited once.
- Fast and simple, but does not guarantee the optimal route.
- Expected classroom complexity note: usually `O(n^2)`.

## Branch and Bound

- Explore possible TSP routes as a search tree.
- Track current route, current cost, visited locations, and best known route.
- Cut branches that cannot beat the current best route.
- Finds the optimal route for small inputs, but becomes slow as `n` grows.
- Demo should use around 5-10 locations.
