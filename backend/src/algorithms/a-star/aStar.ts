import { performance } from "node:perf_hooks";

import type { GraphNode, GraphEdge, PathSolveRequest, PathSolveResult } from "../../types/path.js";
import { MinPriorityQueue } from "../../utils/priorityQueue/priorityQueue.js";
import { calculateHeuristic } from "../../utils/heuristic/heuristic.js";
import { haversineDistance } from "../../utils/haversine/haversine.js";
import { reconstructPath } from "../../utils/path/path.js";
import { calculatePathCost } from "../../utils/route.js";

// Thuật toán A* để tìm đường đi ngắn nhất
type NeighborEdge = {
  nodeId: number;
  weight: number;
};

type QueueNode = {
  nodeId: number;
  gScore: number;
};

function getNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean,
): NeighborEdge[] {
  return edges.flatMap((edge) => {
    if (edge.from === nodeId) {
      return [{ nodeId: edge.to, weight: edge.weight }];
    }

    if (!directed && edge.to === nodeId) {
      return [{ nodeId: edge.from, weight: edge.weight }];
    }

    return [];
  });
}

export const astar = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: number,
  endId: number,
  directed = false,
): number[] => {
  // khởi tạo các giá trị cần thiết
  const startNode = nodes.find((node) => node.id === startId);
  const endNode = nodes.find((node) => node.id === endId);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const gScores = new Map<number, number>(); // Chi phí từ start đến node hiện tại
  const fScores = new Map<number, number>(); // chi phí ước lượng từ start đến đích qua node hiện tại
  const previous = new Map<number, number>(); // Để truy vết đường đi
  const queue = new MinPriorityQueue<QueueNode>();

  if (!startNode || !endNode) {
    return [];
  }

  if (startId === endId) {
    return [startId];
  }

  // thiết lập giá trị ban đầu
  gScores.set(startId, 0);
  fScores.set(startId, calculateHeuristic(startNode, endNode));
  queue.push({ nodeId: startId, gScore: 0 }, fScores.get(startId) ?? 0);

  // vòng lập thuật toán chính
  while (!queue.isEmpty()) {
    const current = queue.popMin()?.item;

    if (!current) {
      break;
    }

    const currentId = current.nodeId;
    const bestKnownG = gScores.get(currentId) ?? Number.POSITIVE_INFINITY;

    if (current.gScore > bestKnownG) {
      continue;
    }

    if (currentId === endId) {
      return reconstructPath(previous, endId);
    }

    const neighbors = getNeighborEdges(currentId, edges, directed);
    for (const edge of neighbors) {
      const neighborNode = nodeById.get(edge.nodeId);
      if (!neighborNode) {
        continue;
      }

      const tentativeG = current.gScore + edge.weight;
      // kiểm tra xem đường đi mới này và đường đi cũ đến điểm kế tiếp đường nào tốt hơn nếu đường mới tốt hơn thì
      // cập nhật lại gScore và fScore của điểm kế tiếp và lưu lại điểm hiện tại là cha của điểm kế tiếp để sau này truy vết đường đi
      if (tentativeG < (gScores.get(edge.nodeId) ?? Number.POSITIVE_INFINITY)) {
        previous.set(edge.nodeId, currentId);
        gScores.set(edge.nodeId, tentativeG);
        const h = calculateHeuristic(neighborNode, endNode);
        fScores.set(edge.nodeId, tentativeG + h);
        queue.push({ nodeId: edge.nodeId, gScore: tentativeG }, fScores.get(edge.nodeId) ?? 0);
      }
    }
  }

  return []; // không tìm thấy đường đi
};

type TraceStep = NonNullable<PathSolveResult["traceSteps"]>[number];
type QueueEntry = TraceStep["queue"][number];
type NodeMetric = TraceStep["nodes"][number];

type TraceNeighborEdge = NeighborEdge & {
  edge: GraphEdge;
};

type TraceQueueNode = QueueNode & {
  hScore: number;
  fScore: number;
  sequence: number;
};

function getTraceNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean,
): TraceNeighborEdge[] {
  return edges
    .flatMap((edge) => {
      if (edge.from === nodeId) {
        return [{ nodeId: edge.to, weight: edge.weight, edge }];
      }

      if (!directed && edge.to === nodeId) {
        return [{ nodeId: edge.from, weight: edge.weight, edge }];
      }

      return [];
    })
    .sort((left, right) => left.weight - right.weight || left.nodeId - right.nodeId);
}

function removeTraceQueueNode(queueNodes: TraceQueueNode[], node: TraceQueueNode): void {
  const index = queueNodes.findIndex((candidate) => candidate.sequence === node.sequence);
  if (index >= 0) {
    queueNodes.splice(index, 1);
  }
}

function traceQueueSnapshot(queueNodes: TraceQueueNode[], gScores: Map<number, number>): QueueEntry[] {
  const bestByNode = new Map<number, QueueEntry>();

  for (const item of queueNodes) {
    const bestKnownG = gScores.get(item.nodeId) ?? Number.POSITIVE_INFINITY;
    if (item.gScore > bestKnownG) {
      continue;
    }

    const current = bestByNode.get(item.nodeId);
    if (!current || item.fScore < current.priority) {
      bestByNode.set(item.nodeId, {
        node: item.nodeId,
        priority: Number(item.fScore.toFixed(2)),
        cost: Number(item.gScore.toFixed(2)),
        heuristic: Number(item.hScore.toFixed(2)),
      });
    }
  }

  return [...bestByNode.values()].sort(
    (left, right) => left.priority - right.priority || left.node - right.node,
  );
}

function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : undefined;
}

function buildTraceNodeMetrics({
  nodes,
  currentNode,
  queueNodes,
  expanded,
  previous,
  gScores,
  heuristics,
  path = [],
}: {
  nodes: GraphNode[];
  currentNode?: number;
  queueNodes: TraceQueueNode[];
  expanded: Set<number>;
  previous: Map<number, number>;
  gScores: Map<number, number>;
  heuristics: Map<number, number>;
  path?: number[];
}): NodeMetric[] {
  const queued = new Set(
    queueNodes
      .filter((item) => item.gScore <= (gScores.get(item.nodeId) ?? Number.POSITIVE_INFINITY))
      .map((item) => item.nodeId),
  );
  const pathSet = new Set(path);

  return nodes.map((node) => {
    const gCost = gScores.get(node.id) ?? Number.POSITIVE_INFINITY;
    const hCost = heuristics.get(node.id) ?? 0;
    const status: NodeMetric["status"] = pathSet.has(node.id)
      ? "path"
      : currentNode === node.id
        ? "current"
        : queued.has(node.id)
          ? "queued"
          : expanded.has(node.id)
            ? "visited"
            : "unvisited";

    return {
      node: node.id,
      status,
      previous: previous.get(node.id),
      gCost: finiteOrUndefined(gCost),
      hCost: Number(hCost.toFixed(2)),
      fCost: Number.isFinite(gCost) ? Number((gCost + hCost).toFixed(2)) : undefined,
    };
  });
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

function calculateTraceHeuristicScale(nodes: GraphNode[], edges: GraphEdge[]): number {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ratios = edges.flatMap((edge) => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) {
      return [];
    }

    const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    return distance > 0 ? [edge.weight / distance] : [];
  });

  return ratios.length > 0 ? Math.max(0, Math.min(...ratios) * 0.95) : 0;
}

function buildTraceHeuristics(
  nodes: GraphNode[],
  targetNode: GraphNode,
  edges: GraphEdge[],
): Map<number, number> {
  const scale = calculateTraceHeuristicScale(nodes, edges);

  return new Map(
    nodes.map((node) => {
      const distance =
        node.id === targetNode.id
          ? 0
          : haversineDistance(node.lat, node.lng, targetNode.lat, targetNode.lng);
      return [node.id, Number((distance * scale).toFixed(3))];
    }),
  );
}

function emptySolveResult(startedAt: number): PathSolveResult {
  return {
    path: [],
    totalCost: 0,
    runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
    visitedOrder: [],
    relaxedEdges: [],
    traceSteps: [],
  };
}

// Adapter cho REST API: giữ core astar(...) ở trên, chỉ chạy thêm một lượt A*
// có ghi trace để frontend hiển thị bảng g(n), h(n), f(n) và replay thuật toán.
// Heuristic trong adapter được scale theo trọng số cạnh để tránh overestimate,
// nhờ vậy endpoint vẫn trả shortest path đúng trên graph demo có weight tùy ý.
export function solveAStar(request: PathSolveRequest): PathSolveResult {
  const startedAt = performance.now();
  const targetNode = request.nodes.find((node) => node.id === request.target);
  const nodeById = new Map(request.nodes.map((node) => [node.id, node]));

  if (!nodeById.has(request.source) || !targetNode) {
    return emptySolveResult(startedAt);
  }

  const directed = request.directed ?? false;
  const heuristics = buildTraceHeuristics(request.nodes, targetNode, request.edges);
  const gScores = new Map(request.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<number, number>();
  const expanded = new Set<number>();
  const queue = new MinPriorityQueue<TraceQueueNode>();
  const queueNodes: TraceQueueNode[] = [];
  const visitedOrder: number[] = [];
  const relaxedEdges: NonNullable<PathSolveResult["relaxedEdges"]> = [];
  const traceSteps: NonNullable<PathSolveResult["traceSteps"]> = [];
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

    if (!current) {
      break;
    }

    removeTraceQueueNode(queueNodes, current);

    const currentId = current.nodeId;
    const bestKnownG = gScores.get(currentId) ?? Number.POSITIVE_INFINITY;

    if (current.gScore > bestKnownG) {
      continue;
    }

    if (!expanded.has(currentId)) {
      visitedOrder.push(currentId);
    }
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

    if (currentId === request.target) {
      break;
    }

    for (const edge of getTraceNeighborEdges(currentId, request.edges, directed)) {
      const neighborNode = nodeById.get(edge.nodeId);
      if (!neighborNode) {
        continue;
      }

      const tentativeG = current.gScore + edge.weight;
      if (tentativeG < (gScores.get(edge.nodeId) ?? Number.POSITIVE_INFINITY)) {
        previous.set(edge.nodeId, currentId);
        gScores.set(edge.nodeId, tentativeG);
        enqueue(edge.nodeId, tentativeG);

        const hScore = heuristics.get(edge.nodeId) ?? 0;
        const fScore = tentativeG + hScore;
        const cumulativeCost = Number(tentativeG.toFixed(2));
        relaxedEdges.push({
          from: currentId,
          to: edge.nodeId,
          cumulativeCost,
        });

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
  const hasPath = path.length > 0 && path[0] === request.source && path.at(-1) === request.target;
  const normalizedPath = hasPath ? path : [];
  const totalCost = normalizedPath.length > 0 ? calculatePathCost(normalizedPath, request.edges, directed) : 0;

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
