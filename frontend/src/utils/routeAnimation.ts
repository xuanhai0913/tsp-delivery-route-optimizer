import type { Coordinate, GraphEdge, GraphNode, PathSegment } from "../types/path";
import { edgeToCoordinates, findEdge } from "./route";

function getCoordinate(nodeId: number, nodes: GraphNode[]): Coordinate | undefined {
  const node = nodes.find((item) => item.id === nodeId);
  return node ? [node.lat, node.lng] : undefined;
}

export function buildPathSegments(
  path: number[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed = false
): PathSegment[] {
  let cumulativeCost = 0;

  return path.slice(0, -1).flatMap((from, stepIndex) => {
    const to = path[stepIndex + 1];
    const fromCoordinate = getCoordinate(from, nodes);
    const toCoordinate = getCoordinate(to, nodes);
    const edge = findEdge(from, to, edges, directed);
    const edgeCost = edge?.weight ?? 0;

    if (!fromCoordinate || !toCoordinate || !edge) {
      return [];
    }

    cumulativeCost = Number((cumulativeCost + edgeCost).toFixed(2));
    const coordinates = edgeToCoordinates(edge, nodes, directed, from, to);

    return [
      {
        stepIndex,
        from,
        to,
        fromCoordinate,
        toCoordinate,
        coordinates: coordinates.length >= 2 ? coordinates : [fromCoordinate, toCoordinate],
        edgeCost,
        cumulativeCost,
      },
    ];
  });
}

export function interpolateCoordinate(from: Coordinate, to: Coordinate, progress: number): Coordinate {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return [
    from[0] + (to[0] - from[0]) * clampedProgress,
    from[1] + (to[1] - from[1]) * clampedProgress,
  ];
}

function coordinateDistance(from: Coordinate, to: Coordinate): number {
  const deltaLat = to[0] - from[0];
  const deltaLng = to[1] - from[1];
  return Math.hypot(deltaLat, deltaLng);
}

export function interpolatePolylineCoordinate(coordinates: Coordinate[], progress: number): Coordinate {
  if (coordinates.length === 0) {
    return [0, 0];
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const lengths = coordinates.slice(0, -1).map((coordinate, index) => coordinateDistance(coordinate, coordinates[index + 1]));
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  if (totalLength === 0) {
    return coordinates.at(-1) ?? coordinates[0];
  }

  let targetLength = totalLength * clampedProgress;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (targetLength <= length) {
      return interpolateCoordinate(coordinates[index], coordinates[index + 1], length === 0 ? 1 : targetLength / length);
    }
    targetLength -= length;
  }

  return coordinates.at(-1) ?? coordinates[0];
}

export function partialSegmentCoordinates(segment: PathSegment, progress: number): Coordinate[] {
  const coordinates = segment.coordinates.length >= 2 ? segment.coordinates : [segment.fromCoordinate, segment.toCoordinate];
  const currentPosition = interpolatePolylineCoordinate(coordinates, progress);
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  if (clampedProgress <= 0) {
    return [coordinates[0], currentPosition];
  }

  if (clampedProgress >= 1) {
    return coordinates;
  }

  const lengths = coordinates.slice(0, -1).map((coordinate, index) => coordinateDistance(coordinate, coordinates[index + 1]));
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  let targetLength = totalLength * clampedProgress;
  const partial: Coordinate[] = [coordinates[0]];

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (targetLength > length) {
      partial.push(coordinates[index + 1]);
      targetLength -= length;
      continue;
    }

    partial.push(currentPosition);
    break;
  }

  return partial;
}

export function pathSegmentCoordinates(segments: PathSegment[]): Coordinate[] {
  if (segments.length === 0) {
    return [];
  }

  return segments.reduce<Coordinate[]>((coordinates, segment) => {
    const segmentCoordinates = segment.coordinates.length >= 2 ? segment.coordinates : [segment.fromCoordinate, segment.toCoordinate];
    if (coordinates.length === 0) {
      coordinates.push(...segmentCoordinates);
      return coordinates;
    }

    const [first, ...rest] = segmentCoordinates;
    const previous = coordinates[coordinates.length - 1];
    coordinates.push(...(previous[0] === first[0] && previous[1] === first[1] ? rest : segmentCoordinates));
    return coordinates;
  }, []);
}
