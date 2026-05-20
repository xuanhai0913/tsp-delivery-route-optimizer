import type { Coordinate, Location, RouteSegment } from "../types/tsp";

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function buildRouteSegments(
  route: number[],
  locations: Location[],
  costMatrix: number[][]
): RouteSegment[] {
  const locationById = new Map(locations.map((location) => [location.id, location]));
  let cumulativeCost = 0;

  return route.slice(0, -1).flatMap((from, stepIndex) => {
    const to = route[stepIndex + 1];
    const fromLocation = locationById.get(from);
    const toLocation = locationById.get(to);

    if (!fromLocation || !toLocation) {
      return [];
    }

    const edgeCost = costMatrix[from]?.[to] ?? 0;
    cumulativeCost = Number((cumulativeCost + edgeCost).toFixed(2));

    return [
      {
        stepIndex,
        from,
        to,
        fromCoordinate: [fromLocation.lat, fromLocation.lng] as Coordinate,
        toCoordinate: [toLocation.lat, toLocation.lng] as Coordinate,
        edgeCost,
        cumulativeCost,
      },
    ];
  });
}

export function interpolateCoordinate(
  from: Coordinate,
  to: Coordinate,
  progress: number
): Coordinate {
  const safeProgress = clampProgress(progress);
  return [
    Number((from[0] + (to[0] - from[0]) * safeProgress).toFixed(6)),
    Number((from[1] + (to[1] - from[1]) * safeProgress).toFixed(6)),
  ];
}

export function routeSegmentCoordinates(segments: RouteSegment[]): Coordinate[] {
  if (segments.length === 0) {
    return [];
  }

  return [segments[0].fromCoordinate, ...segments.map((segment) => segment.toCoordinate)];
}
