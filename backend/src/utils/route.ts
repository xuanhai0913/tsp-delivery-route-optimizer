export function calculateRouteCost(route: number[], costMatrix: number[][]): number {
  if (route.length < 2) {
    return 0;
  }

  let totalCost = 0;
  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    totalCost += costMatrix[from]?.[to] ?? Number.POSITIVE_INFINITY;
  }

  return Number(totalCost.toFixed(2));
}

export function isCompleteTour(route: number[], locationCount: number, start: number): boolean {
  if (route.length !== locationCount + 1) {
    return false;
  }

  if (route[0] !== start || route[route.length - 1] !== start) {
    return false;
  }

  const visitedOnceBeforeReturn = route.slice(0, -1);
  const uniqueVisited = new Set(visitedOnceBeforeReturn);

  return uniqueVisited.size === locationCount && uniqueVisited.has(start);
}
