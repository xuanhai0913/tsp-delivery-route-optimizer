import { performance } from "node:perf_hooks";

import type { GraphEdge, PathSolveRequest, PathSolveResult } from "../../types/path.js";
import { calculatePathCost } from "../../utils/route.js";

// Thuật toán Floyd-Warshall tìm shortest path cho mọi cặp node bằng dynamic programming.
// Ý tưởng:
// - dist[i][j]: chi phí tốt nhất hiện biết từ i đến j.
// - next[i][j]: node kế tiếp phải đi từ i nếu muốn tới j theo path tối ưu.
// - Với mỗi node trung gian k, thử cải thiện mọi cặp i -> j bằng đường i -> k -> j.
type TraceStep = NonNullable<PathSolveResult["traceSteps"]>[number];
type NodeMetric = TraceStep["nodes"][number];

export class NegativeCycleError extends Error {
  status = 400;

  constructor(nodeId: number) {
    super(`Floyd-Warshall detected a negative-weight cycle involving node ${nodeId}.`);
    this.name = "NegativeCycleError";
  }
}

function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : undefined;
}

function pushTraceStep(
  traceSteps: NonNullable<PathSolveResult["traceSteps"]>,
  step: Omit<TraceStep, "stepIndex">,
): void {
  traceSteps.push({
    ...step,
    stepIndex: traceSteps.length,
  });
}

function buildNodeMetrics({
  nodeIds,
  source,
  target,
  distancesFromSource,
  previous,
  currentNode,
  path = [],
}: {
  nodeIds: number[];
  source: number;
  target: number;
  distancesFromSource: Map<number, number>;
  previous: Map<number, number>;
  currentNode?: number;
  path?: number[];
}): NodeMetric[] {
  const pathSet = new Set(path);
  const orderedNodeIds =
    path.length > 0
      ? [...path, ...nodeIds.filter((node) => !pathSet.has(node))]
      : nodeIds;

  return orderedNodeIds.map((node) => {
    const status: NodeMetric["status"] = pathSet.has(node)
      ? "path"
      : currentNode === node
        ? "current"
        : node === source || node === target
          ? "queued"
          : Number.isFinite(distancesFromSource.get(node) ?? Number.POSITIVE_INFINITY)
            ? "visited"
            : "unvisited";

    return {
      node,
      status,
      distance: finiteOrUndefined(distancesFromSource.get(node) ?? Number.POSITIVE_INFINITY),
      previous: previous.get(node),
    };
  });
}

function buildPreviousFromPath(path: number[]): Map<number, number> {
  const previous = new Map<number, number>();

  for (let index = 1; index < path.length; index += 1) {
    previous.set(path[index], path[index - 1]);
  }

  return previous;
}

function buildPreviousFromNextMatrix({
  next,
  indexByNode,
  nodeIds,
  source,
}: {
  next: Array<Array<number | undefined>>;
  indexByNode: Map<number, number>;
  nodeIds: number[];
  source: number;
}): Map<number, number> {
  const previous = new Map<number, number>();

  for (const target of nodeIds) {
    const path = reconstructPath(next, indexByNode, nodeIds, source, target);
    for (let index = 1; index < path.length; index += 1) {
      previous.set(path[index], path[index - 1]);
    }
  }

  return previous;
}

function reconstructPath(
  next: Array<Array<number | undefined>>,
  indexByNode: Map<number, number>,
  nodeIds: number[],
  source: number,
  target: number,
): number[] {
  const sourceIndex = indexByNode.get(source);
  const targetIndex = indexByNode.get(target);

  if (sourceIndex === undefined || targetIndex === undefined || next[sourceIndex][targetIndex] === undefined) {
    return [];
  }

  const path = [source];
  let current = sourceIndex;

  // Dùng next matrix để đi từng bước source -> ... -> target. Đây là lý do
  // Floyd-Warshall cần lưu next[i][j], không chỉ lưu dist[i][j].
  while (current !== targetIndex) {
    const nextIndex = next[current][targetIndex];
    if (nextIndex === undefined) {
      return [];
    }

    current = nextIndex;
    path.push(nodeIds[current]);

    if (path.length > nodeIds.length + 1) {
      return [];
    }
  }

  return path;
}

export function floydWarshall(
  nodes: PathSolveRequest["nodes"],
  edges: GraphEdge[],
  source: number,
  target: number,
  directed = false,
): number[] {
  return solveFloydWarshall({
    source,
    target,
    nodes,
    edges,
    directed,
  }).path;
}

export function solveFloydWarshall(request: PathSolveRequest): PathSolveResult {
  const startedAt = performance.now();
  const directed = request.directed ?? false;
  const nodeIds = request.nodes.map((node) => node.id);
  const indexByNode = new Map(nodeIds.map((node, index) => [node, index]));
  const size = nodeIds.length;
  const distances = Array.from({ length: size }, () => Array<number>(size).fill(Number.POSITIVE_INFINITY));
  const next = Array.from({ length: size }, () => Array<number | undefined>(size).fill(undefined));
  const traceSteps: NonNullable<PathSolveResult["traceSteps"]> = [];
  const relaxedEdges: NonNullable<PathSolveResult["relaxedEdges"]> = [];
  const visitedOrder: number[] = [];

  for (let index = 0; index < size; index += 1) {
    distances[index][index] = 0;
    next[index][index] = index;
  }

  for (const edge of request.edges) {
    const fromIndex = indexByNode.get(edge.from);
    const toIndex = indexByNode.get(edge.to);

    if (fromIndex === undefined || toIndex === undefined) {
      continue;
    }

    if (edge.weight < distances[fromIndex][toIndex]) {
      distances[fromIndex][toIndex] = edge.weight;
      next[fromIndex][toIndex] = toIndex;
    }

    if (!directed && edge.weight < distances[toIndex][fromIndex]) {
      distances[toIndex][fromIndex] = edge.weight;
      next[toIndex][fromIndex] = fromIndex;
    }
  }

  const sourceIndex = indexByNode.get(request.source);
  const targetIndex = indexByNode.get(request.target);

  pushTraceStep(traceSteps, {
    phase: "select-current",
    currentNode: request.source,
    queue: [],
    nodes: buildNodeMetrics({
      nodeIds,
      source: request.source,
      target: request.target,
      distancesFromSource: new Map(nodeIds.map((node, index) => [node, sourceIndex === undefined ? Number.POSITIVE_INFINITY : distances[sourceIndex][index]])),
      previous: sourceIndex === undefined
        ? new Map()
        : buildPreviousFromNextMatrix({ next, indexByNode, nodeIds, source: request.source }),
      currentNode: request.source,
    }),
    message: "Floyd-Warshall khởi tạo ma trận khoảng cách mọi cặp node.",
  });

  for (let k = 0; k < size; k += 1) {
    const viaNode = nodeIds[k];
    visitedOrder.push(viaNode);

    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        const candidate = distances[i][k] + distances[k][j];

        if (candidate < distances[i][j]) {
          distances[i][j] = candidate;
          next[i][j] = next[i][k];

          const from = nodeIds[i];
          const to = nodeIds[j];
          const cumulativeCost = Number(candidate.toFixed(2));

          if (i === sourceIndex) {
            relaxedEdges.push({ from, to, cumulativeCost });
          }

          if (i === sourceIndex || j === targetIndex) {
            pushTraceStep(traceSteps, {
              phase: "relax-edge",
              currentNode: viaNode,
              queue: [],
              nodes: buildNodeMetrics({
                nodeIds,
                source: request.source,
                target: request.target,
                distancesFromSource: new Map(nodeIds.map((node, index) => [node, sourceIndex === undefined ? Number.POSITIVE_INFINITY : distances[sourceIndex][index]])),
                previous: sourceIndex === undefined
                  ? new Map()
                  : buildPreviousFromNextMatrix({ next, indexByNode, nodeIds, source: request.source }),
                currentNode: viaNode,
              }),
              message: `Dùng node ${viaNode} làm trung gian: cập nhật dist[${from}][${to}] = ${cumulativeCost}.`,
            });
          }
        }
      }
    }
  }

  for (let index = 0; index < size; index += 1) {
    if (distances[index][index] < 0) {
      throw new NegativeCycleError(nodeIds[index]);
    }
  }

  const path =
    sourceIndex === undefined || targetIndex === undefined
      ? []
      : reconstructPath(next, indexByNode, nodeIds, request.source, request.target);
  const totalCost = path.length > 0 ? calculatePathCost(path, request.edges, directed) : 0;
  const previous = buildPreviousFromPath(path);

  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: path.length > 0 ? request.target : undefined,
    queue: [],
    nodes: buildNodeMetrics({
      nodeIds,
      source: request.source,
      target: request.target,
      distancesFromSource: new Map(nodeIds.map((node, index) => [node, sourceIndex === undefined ? Number.POSITIVE_INFINITY : distances[sourceIndex][index]])),
      previous,
      currentNode: path.length > 0 ? request.target : undefined,
      path,
    }),
    message:
      path.length > 0
        ? `Floyd-Warshall dựng path ${request.source} → ${request.target}: ${path.join(" → ")}.`
        : `Không tìm thấy đường đi từ ${request.source} đến ${request.target}.`,
  });

  return {
    path,
    totalCost,
    runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
    visitedOrder,
    relaxedEdges,
    traceSteps,
  };
}
