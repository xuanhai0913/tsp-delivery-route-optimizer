import { performance } from "node:perf_hooks";
import type {
  GraphNode,
  GraphEdge,
  PathSolveRequest,
  PathSolveResult,
} from "../../types/path.js";
import { MinPriorityQueue } from "../../utils/priorityQueue/priorityQueue.js";
import { reconstructPath } from "../../utils/path/path.js";
import { calculatePathCost } from "../../utils/route.js";

// Import các tiện ích Heuristics đã được chuẩn hóa
import {
  calculateHeuristic,
  calculateHeuristicScale,
  buildTraceHeuristics,
} from "../../utils/heuristic/heuristic.js";

// Import các công cụ Tracing được cô lập từ file mới
import {
  getTraceNeighborEdges,
  removeTraceQueueNode,
  traceQueueSnapshot,
  buildTraceNodeMetrics,
  pushTraceStep,
  type TraceQueueNode,
} from "./aStarTraceUtils.js";

type NeighborEdge = { nodeId: number; weight: number };
type QueueNode = { nodeId: number; gScore: number };

function getNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean,
): NeighborEdge[] {
  return edges.flatMap((edge) => {
    if (edge.from === nodeId) return [{ nodeId: edge.to, weight: edge.weight }];
    if (!directed && edge.to === nodeId)
      return [{ nodeId: edge.from, weight: edge.weight }];
    return [];
  });
}

// Hàm lõi thuật toán A* gốc (Đã được scale động hóa)
export const astar = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: number,
  endId: number,
  directed = false,
): number[] => {
  const startNode = nodes.find((node) => node.id === startId);
  const endNode = nodes.find((node) => node.id === endId);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  if (!startNode || !endNode) return [];
  if (startId === endId) return [startId];

  // Tính toán scale factor động trực tiếp từ đồ thị cấp vào
  const scale = calculateHeuristicScale(nodes, edges);

  const gScores = new Map<number, number>();
  const fScores = new Map<number, number>();
  const previous = new Map<number, number>();
  // hàng đợi ưu tiên
  const queue = new MinPriorityQueue<QueueNode>();

  gScores.set(startId, 0);
  fScores.set(startId, calculateHeuristic(startNode, endNode, scale));
  queue.push({ nodeId: startId, gScore: 0 }, fScores.get(startId) ?? 0);

  while (!queue.isEmpty()) {
    const current = queue.popMin()?.item;
    if (!current) break;

    const currentId = current.nodeId;
    const bestKnownG = gScores.get(currentId) ?? Number.POSITIVE_INFINITY;

    if (current.gScore > bestKnownG) continue;
    if (currentId === endId) return reconstructPath(previous, endId);

    const neighbors = getNeighborEdges(currentId, edges, directed);
    for (const edge of neighbors) {
      const neighborNode = nodeById.get(edge.nodeId);
      if (!neighborNode) continue;

      const tentativeG = current.gScore + edge.weight;
      if (tentativeG < (gScores.get(edge.nodeId) ?? Number.POSITIVE_INFINITY)) {
        previous.set(edge.nodeId, currentId);
        gScores.set(edge.nodeId, tentativeG);

        const h = calculateHeuristic(neighborNode, endNode, scale);
        fScores.set(edge.nodeId, tentativeG + h);
        queue.push(
          { nodeId: edge.nodeId, gScore: tentativeG },
          fScores.get(edge.nodeId) ?? 0,
        );
      }
    }
  }
  return [];
};

// REST API Adapter: Chạy thuật toán kèm sinh gói tin Tracing phục vụ frontend Replay
export function solveAStar(request: PathSolveRequest): PathSolveResult {
  const startedAt = performance.now();
  const targetNode = request.nodes.find((node) => node.id === request.target);
  const nodeById = new Map(request.nodes.map((node) => [node.id, node]));

  if (!nodeById.has(request.source) || !targetNode) {
    return {
      path: [],
      totalCost: 0,
      runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
      visitedOrder: [],
      relaxedEdges: [],
      traceSteps: [],
    };
  }

  const directed = request.directed ?? false;
  const heuristics = buildTraceHeuristics(
    request.nodes,
    targetNode,
    request.edges,
  );
  const gScores = new Map(
    request.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]),
  );
  const previous = new Map<number, number>();
  const expanded = new Set<number>();
  const queue = new MinPriorityQueue<TraceQueueNode>();
  const queueNodes: TraceQueueNode[] = [];
  const visitedOrder: number[] = [];
  const relaxedEdges: PathSolveResult["relaxedEdges"] = [];
  const traceSteps: PathSolveResult["traceSteps"] = [];
  let sequence = 0;

  function enqueue(nodeId: number, gScore: number): void {
    const hScore = heuristics.get(nodeId) ?? 0;
    const fScore = gScore + hScore;
    const node = { nodeId, gScore, hScore, fScore, sequence };
    sequence += 1;
    queue.push(node, fScore);
    queueNodes.push(node);
  }

  gScores.set(request.source, 0);
  enqueue(request.source, 0);

  while (!queue.isEmpty()) {
    const current = queue.popMin()?.item;
    if (!current) break;

    removeTraceQueueNode(queueNodes, current);
    const currentId = current.nodeId;
    const bestKnownG = gScores.get(currentId) ?? Number.POSITIVE_INFINITY;

    if (current.gScore > bestKnownG) continue;
    if (!expanded.has(currentId)) visitedOrder.push(currentId);
    expanded.add(currentId);

    pushTraceStep(traceSteps, {
      phase: "select-current",
      currentNode: currentId,
      queue: traceQueueSnapshot(queueNodes, gScores),
      nodes: buildTraceNodeMetrics({
        nodes: request.nodes,
        currentNode: currentId,
        queueNodes,
        expanded,
        previous,
        gScores,
        heuristics,
      }),
      message: `Chọn node ${currentId} vì f(n) nhỏ nhất (${current.fScore.toFixed(2)}).`,
    });

    if (currentId === request.target) break;

    for (const edge of getTraceNeighborEdges(
      currentId,
      request.edges,
      directed,
    )) {
      if (!nodeById.has(edge.nodeId)) continue;

      const tentativeG = current.gScore + edge.weight;
      if (tentativeG < (gScores.get(edge.nodeId) ?? Number.POSITIVE_INFINITY)) {
        previous.set(edge.nodeId, currentId);
        gScores.set(edge.nodeId, tentativeG);
        enqueue(edge.nodeId, tentativeG);

        const hScore = heuristics.get(edge.nodeId) ?? 0;
        const fScore = tentativeG + hScore;
        const cumulativeCost = Number(tentativeG.toFixed(2));
        relaxedEdges.push({ from: currentId, to: edge.nodeId, cumulativeCost });

        pushTraceStep(traceSteps, {
          phase: "relax-edge",
          currentNode: currentId,
          relaxedEdge: {
            id: edge.edge.id,
            from: currentId,
            to: edge.nodeId,
            weight: edge.weight,
            cumulativeCost,
          },
          queue: traceQueueSnapshot(queueNodes, gScores),
          nodes: buildTraceNodeMetrics({
            nodes: request.nodes,
            currentNode: currentId,
            queueNodes,
            expanded,
            previous,
            gScores,
            heuristics,
          }),
          message: `Relax ${currentId} → ${edge.nodeId}: g=${tentativeG.toFixed(2)}, h=${hScore.toFixed(2)}, f=${fScore.toFixed(2)}.`,
        });
      }
    }
  }

  const path = reconstructPath(previous, request.target);
  const hasPath =
    path.length > 0 &&
    path[0] === request.source &&
    path.at(-1) === request.target;
  const normalizedPath = hasPath ? path : [];
  const totalCost =
    normalizedPath.length > 0
      ? calculatePathCost(normalizedPath, request.edges, directed)
      : 0;

  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: normalizedPath.length > 0 ? request.target : undefined,
    queue: traceQueueSnapshot(queueNodes, gScores),
    nodes: buildTraceNodeMetrics({
      nodes: request.nodes,
      currentNode: normalizedPath.length > 0 ? request.target : undefined,
      queueNodes,
      expanded,
      previous,
      gScores,
      heuristics,
      path: normalizedPath,
    }),
    message:
      normalizedPath.length > 0
        ? `A* hoàn tất path: ${normalizedPath.join(" → ")}.`
        : `Không tìm thấy đường đi từ ${request.source} đến ${request.target}.`,
  });

  return {
    path: normalizedPath,
    totalCost,
    runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
    visitedOrder,
    relaxedEdges,
    traceSteps,
  };
}
