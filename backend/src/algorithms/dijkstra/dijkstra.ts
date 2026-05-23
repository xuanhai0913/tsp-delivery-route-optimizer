import { performance } from "node:perf_hooks";

import type { GraphEdge, PathSolveRequest, PathSolveResult } from "../../types/path.js";
import { MinPriorityQueue } from "../../utils/priorityQueue/priorityQueue.js";
import { calculatePathCost } from "../../utils/route.js";

// Thuật toán Dijkstra tìm đường đi ngắn nhất trên graph có trọng số không âm.
// Ý tưởng chính:
// - distances[node]: chi phí tốt nhất hiện biết từ source đến node.
// - previous[node]: node đứng trước để truy vết lại đường đi cuối cùng.
// - priority queue: luôn lấy node có distance nhỏ nhất ra xét trước.
// - relax edge: nếu đi qua current làm đường tới neighbor rẻ hơn thì cập nhật.
type NeighborEdge = {
  nodeId: number;
  weight: number;
  edge: GraphEdge;
};

type QueueItem = {
  nodeId: number;
  cost: number;
  sequence: number;
};

type TraceStep = NonNullable<PathSolveResult["traceSteps"]>[number];
type QueueEntry = TraceStep["queue"][number];
type NodeMetric = TraceStep["nodes"][number];

function getNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean,
): NeighborEdge[] {
  // Lấy các cạnh kề của node hiện tại. Với graph không có hướng, cạnh to -> from
  // cũng được xem như một hướng đi hợp lệ.
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

function removeQueueItem(queueItems: QueueItem[], item: QueueItem): void {
  const index = queueItems.findIndex((candidate) => candidate.sequence === item.sequence);
  if (index >= 0) {
    queueItems.splice(index, 1);
  }
}

function queueSnapshot(
  queueItems: QueueItem[],
  distances: Map<number, number>,
  visited: Set<number>,
): QueueEntry[] {
  const bestByNode = new Map<number, QueueEntry>();

  // Snapshot chỉ dùng cho replay UI. Vì một node có thể được push vào queue
  // nhiều lần khi tìm được đường tốt hơn, ta bỏ các bản ghi đã visited/stale.
  for (const item of queueItems) {
    const bestKnownDistance = distances.get(item.nodeId) ?? Number.POSITIVE_INFINITY;
    if (visited.has(item.nodeId) || item.cost > bestKnownDistance) {
      continue;
    }

    const current = bestByNode.get(item.nodeId);
    if (!current || item.cost < current.cost) {
      bestByNode.set(item.nodeId, {
        node: item.nodeId,
        priority: Number(item.cost.toFixed(2)),
        cost: Number(item.cost.toFixed(2)),
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

function buildNodeMetrics({
  nodeIds,
  currentNode,
  queueItems,
  visited,
  previous,
  distances,
  path = [],
}: {
  nodeIds: number[];
  currentNode?: number;
  queueItems: QueueItem[];
  visited: Set<number>;
  previous: Map<number, number>;
  distances: Map<number, number>;
  path?: number[];
}): NodeMetric[] {
  const queued = new Set(queueItems.map((item) => item.nodeId));
  const pathSet = new Set(path);

  return nodeIds.map((node) => {
    const status: NodeMetric["status"] = pathSet.has(node)
      ? "path"
      : currentNode === node
        ? "current"
        : visited.has(node)
          ? "visited"
          : queued.has(node)
            ? "queued"
            : "unvisited";

    return {
      node,
      status,
      distance: finiteOrUndefined(distances.get(node) ?? Number.POSITIVE_INFINITY),
      previous: previous.get(node),
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

function reconstructDijkstraPath(
  previous: Map<number, number>,
  source: number,
  target: number,
): number[] {
  if (source === target) {
    return [source];
  }

  if (!previous.has(target)) {
    return [];
  }

  const path = [target];
  let current = target;

  // Dò ngược target -> source bằng previous, rồi unshift để có path source -> target.
  while (current !== source) {
    const parent = previous.get(current);
    if (parent === undefined) {
      return [];
    }

    path.unshift(parent);
    current = parent;
  }

  return path;
}

export function dijkstra(
  nodes: PathSolveRequest["nodes"],
  edges: GraphEdge[],
  source: number,
  target: number,
  directed = false,
): number[] {
  // Helper gọn cho phần thuật toán: chỉ trả path để dễ test/giải thích trên lớp.
  // API đầy đủ dùng solveDijkstra(...) bên dưới để có runtime và traceSteps.
  return solveDijkstra({
    source,
    target,
    nodes,
    edges,
    directed,
  }).path;
}

export function solveDijkstra(request: PathSolveRequest): PathSolveResult {
  const startedAt = performance.now();
  const distances = new Map(request.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<number, number>(); // Lưu cha của mỗi node để reconstruct path.
  const visited = new Set<number>(); // Node đã được chốt shortest distance.
  const queue = new MinPriorityQueue<QueueItem>(); // Min-heap theo cost nhỏ nhất.
  const queueItems: QueueItem[] = [];
  const visitedOrder: number[] = [];
  const relaxedEdges: NonNullable<PathSolveResult["relaxedEdges"]> = [];
  const traceSteps: NonNullable<PathSolveResult["traceSteps"]> = [];
  const nodeIds = request.nodes.map((node) => node.id);
  const directed = request.directed ?? false;
  let sequence = 0;

  function enqueue(nodeId: number, cost: number): void {
    // sequence giúp phân biệt các bản ghi queue khác nhau của cùng một node.
    const item = { nodeId, cost, sequence };
    sequence += 1;
    queue.push(item, cost);
    queueItems.push(item);
  }

  distances.set(request.source, 0);
  enqueue(request.source, 0);

  // Vòng lặp chính của Dijkstra: lấy node có dist nhỏ nhất, rồi relax các cạnh kề.
  while (!queue.isEmpty()) {
    const currentItem = queue.popMin()?.item;
    if (!currentItem) {
      break;
    }

    removeQueueItem(queueItems, currentItem);

    const bestKnownDistance = distances.get(currentItem.nodeId) ?? Number.POSITIVE_INFINITY;
    if (visited.has(currentItem.nodeId) || currentItem.cost > bestKnownDistance) {
      // Bỏ qua nếu node đã chốt hoặc đây là bản ghi queue cũ với cost lớn hơn.
      continue;
    }

    const currentNode = currentItem.nodeId;
    visited.add(currentNode);
    visitedOrder.push(currentNode);

    pushTraceStep(traceSteps, {
      phase: "select-current",
      currentNode,
      queue: queueSnapshot(queueItems, distances, visited),
      nodes: buildNodeMetrics({
        nodeIds,
        currentNode,
        queueItems,
        visited,
        previous,
        distances,
      }),
      message: `Chọn node ${currentNode} vì có dist nhỏ nhất (${currentItem.cost.toFixed(2)}).`,
    });

    if (currentNode === request.target) {
      // Khi target được lấy ra khỏi priority queue, dist của nó đã là tối ưu.
      break;
    }

    for (const neighbor of getNeighborEdges(currentNode, request.edges, directed)) {
      if (visited.has(neighbor.nodeId)) {
        continue;
      }

      const nextDistance = bestKnownDistance + neighbor.weight;
      if (nextDistance < (distances.get(neighbor.nodeId) ?? Number.POSITIVE_INFINITY)) {
        // Relax edge: tìm được đường rẻ hơn tới neighbor nên cập nhật dist,
        // lưu previous để lát nữa dựng lại path, rồi đưa neighbor vào queue.
        distances.set(neighbor.nodeId, nextDistance);
        previous.set(neighbor.nodeId, currentNode);
        enqueue(neighbor.nodeId, nextDistance);

        const cumulativeCost = Number(nextDistance.toFixed(2));
        relaxedEdges.push({
          from: currentNode,
          to: neighbor.nodeId,
          cumulativeCost,
        });

        pushTraceStep(traceSteps, {
          phase: "relax-edge",
          currentNode,
          relaxedEdge: {
            id: neighbor.edge.id,
            from: currentNode,
            to: neighbor.nodeId,
            weight: neighbor.weight,
            cumulativeCost,
          },
          queue: queueSnapshot(queueItems, distances, visited),
          nodes: buildNodeMetrics({
            nodeIds,
            currentNode,
            queueItems,
            visited,
            previous,
            distances,
          }),
          message: `Relax cạnh ${currentNode} → ${neighbor.nodeId}: cập nhật dist = ${cumulativeCost}.`,
        });
      }
    }
  }

  const path = reconstructDijkstraPath(previous, request.source, request.target);
  const totalCost = path.length > 0 ? calculatePathCost(path, request.edges, directed) : 0;

  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: path.length > 0 ? request.target : undefined,
    queue: queueSnapshot(queueItems, distances, visited),
    nodes: buildNodeMetrics({
      nodeIds,
      currentNode: path.length > 0 ? request.target : undefined,
      queueItems,
      visited,
      previous,
      distances,
      path,
    }),
    message:
      path.length > 0
        ? `Dựng lại shortest path: ${path.join(" → ")}.`
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
