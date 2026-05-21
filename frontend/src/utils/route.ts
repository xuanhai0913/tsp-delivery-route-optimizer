import type { AlgorithmKey, ComparisonRow, Coordinate, GraphEdge, GraphNode, SolveResult } from "../types/path";

export function findEdge(from: number, to: number, edges: GraphEdge[], directed = false): GraphEdge | undefined {
  return edges.find(
    (edge) => (edge.from === from && edge.to === to) || (!directed && edge.from === to && edge.to === from)
  );
}

function nodeCoordinate(nodeId: number, nodes: GraphNode[]): Coordinate | undefined {
  const node = nodes.find((item) => item.id === nodeId);
  return node ? [node.lat, node.lng] : undefined;
}

function sameCoordinate(left: Coordinate, right: Coordinate): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

export function appendCoordinates(target: Coordinate[], coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length === 0) {
    return target;
  }

  if (target.length === 0) {
    target.push(...coordinates);
    return target;
  }

  const [first, ...rest] = coordinates;
  target.push(...(sameCoordinate(target[target.length - 1], first) ? rest : coordinates));
  return target;
}

export function edgeToCoordinates(
  edge: GraphEdge,
  nodes: GraphNode[],
  directed = false,
  from = edge.from,
  to = edge.to
): Coordinate[] {
  const fallbackFrom = nodeCoordinate(from, nodes);
  const fallbackTo = nodeCoordinate(to, nodes);
  const fallback = fallbackFrom && fallbackTo ? [fallbackFrom, fallbackTo] : [];

  if (!edge.geometry || edge.geometry.length < 2) {
    return fallback;
  }

  const geometry = edge.geometry.map((point) => [point.lat, point.lng] as Coordinate);
  if (edge.from === from && edge.to === to) {
    return geometry;
  }

  if (!directed && edge.from === to && edge.to === from) {
    return [...geometry].reverse();
  }

  return fallback;
}

export function calculatePathCost(path: number[], edges: GraphEdge[], directed = false): number {
  if (path.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = findEdge(path[index], path[index + 1], edges, directed);
    if (!edge) {
      return Number.POSITIVE_INFINITY;
    }
    total += edge.weight;
  }

  return Number(total.toFixed(2));
}

export function formatPath(path: number[], nodes: GraphNode[]): string {
  const nodeById = new Map(nodes.map((node) => [node.id, node.name]));
  return path.map((id) => nodeById.get(id) ?? String(id)).join(" → ");
}

export function pathToCoordinates(path: number[], nodes: GraphNode[], edges?: GraphEdge[], directed = false): Coordinate[] {
  if (!edges) {
    return path.flatMap((id) => {
      const coordinate = nodeCoordinate(id, nodes);
      return coordinate ? [coordinate] : [];
    });
  }

  const coordinates: Coordinate[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const edge = findEdge(from, to, edges, directed);
    if (!edge) {
      continue;
    }
    appendCoordinates(coordinates, edgeToCoordinates(edge, nodes, directed, from, to));
  }

  return coordinates;
}

export function pathToLabel(path: number[]): string {
  return path.join(" → ");
}

export function getResultLabel(algorithm: AlgorithmKey): string {
  return algorithm === "dijkstra" ? "Dijkstra" : "A*";
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
    path: result.path,
    totalCost: result.totalCost,
    runtimeMs: result.runtimeMs,
    visitedCount: result.visitedOrder?.length ?? result.path.length,
    note:
      algorithm === "dijkstra"
        ? "Duyệt chắc chắn với trọng số không âm, phù hợp làm baseline tối ưu."
        : "Dùng heuristic tọa độ để ưu tiên hướng gần đích, thường duyệt ít node hơn.",
    isBestCost: result.totalCost === bestCost,
    isFastest: result.runtimeMs === fastestRuntime,
  }));
}
