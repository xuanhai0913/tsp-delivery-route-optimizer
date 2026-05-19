import type { AlgorithmKey, ComparisonRow, Location, SolveResult } from "../types/tsp";

export function calculateRouteCost(route: number[], costMatrix: number[][]): number {
  if (route.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    total += costMatrix[from]?.[to] ?? 0;
  }

  return Number(total.toFixed(2));
}

export function isCompleteTour(route: number[], locationCount: number, start: number): boolean {
  if (route.length !== locationCount + 1) {
    return false;
  }

  if (route[0] !== start || route[route.length - 1] !== start) {
    return false;
  }

  const visited = new Set(route.slice(0, -1));
  return visited.size === locationCount && visited.has(start);
}

export function formatRoute(route: number[], locations: Location[]): string {
  const locationById = new Map(locations.map((location) => [location.id, location.name]));
  return route.map((id) => locationById.get(id) ?? String(id)).join(" → ");
}

export function routeToCoordinates(route: number[], locations: Location[]): [number, number][] {
  const locationById = new Map(locations.map((location) => [location.id, location]));
  return route.flatMap((id) => {
    const location = locationById.get(id);
    return location ? ([[location.lat, location.lng]] as [number, number][]) : [];
  });
}

export function routeToLabel(route: number[]): string {
  return route.join(" → ");
}

export function getResultLabel(algorithm: AlgorithmKey): string {
  return algorithm === "greedy" ? "Greedy" : "Branch and Bound";
}

export function buildComparisonRows(results: Partial<Record<AlgorithmKey, SolveResult>>): ComparisonRow[] {
  const entries = (Object.entries(results) as [AlgorithmKey, SolveResult][])
    .filter(([, result]) => Boolean(result));

  if (entries.length === 0) {
    return [];
  }

  const bestCost = Math.min(...entries.map(([, result]) => result.totalCost));
  const fastestRuntime = Math.min(...entries.map(([, result]) => result.runtimeMs));

  return entries.map(([algorithm, result]) => ({
    algorithm,
    name: getResultLabel(algorithm),
    route: result.route,
    totalCost: result.totalCost,
    runtimeMs: result.runtimeMs,
    note:
      algorithm === "greedy"
        ? "Chạy nhanh, nhưng có thể kẹt ở tối ưu cục bộ."
        : "Tối ưu cho dữ liệu nhỏ, đổi lại thời gian chạy cao hơn.",
    isBestCost: result.totalCost === bestCost,
    isFastest: result.runtimeMs === fastestRuntime,
  }));
}
