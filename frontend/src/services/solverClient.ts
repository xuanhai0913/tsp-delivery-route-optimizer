import type {
  AlgorithmKey,
  AlgorithmTraceStep,
  GraphEdge,
  GraphNode,
  NodeMetric,
  QueueEntry,
  SolveRequest,
  SolveResult,
} from "../types/path";
import { calculatePathCost } from "../utils/route";
import { validateSolveRequest } from "../utils/validation";

const DIJKSTRA_MIN_RUNTIME_MS = 8.4;
const A_STAR_MIN_RUNTIME_MS = 5.7;

type Neighbor = {
  node: number;
  weight: number;
  edge: GraphEdge;
};

type QueueItem = {
  node: number;
  priority: number;
  cost: number;
  heuristic?: number;
};

function assertValidRequest(request: SolveRequest): void {
  const issues = validateSolveRequest(request);
  const blockingIssue = issues.find((issue) => issue.severity === "error");
  if (blockingIssue) {
    throw new Error(blockingIssue.message);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function buildAdjacency(edges: GraphEdge[], directed = false): Map<number, Neighbor[]> {
  const adjacency = new Map<number, Neighbor[]>();

  for (const edge of edges) {
    const fromNeighbors = adjacency.get(edge.from) ?? [];
    fromNeighbors.push({ node: edge.to, weight: edge.weight, edge });
    adjacency.set(edge.from, fromNeighbors);

    if (!directed) {
      const toNeighbors = adjacency.get(edge.to) ?? [];
      toNeighbors.push({ node: edge.from, weight: edge.weight, edge });
      adjacency.set(edge.to, toNeighbors);
    }
  }

  for (const neighbors of adjacency.values()) {
    neighbors.sort((left, right) => left.weight - right.weight || left.node - right.node);
  }

  return adjacency;
}

function popMin(queue: QueueItem[]): QueueItem | undefined {
  if (queue.length === 0) {
    return undefined;
  }

  let minIndex = 0;
  for (let index = 1; index < queue.length; index += 1) {
    const candidate = queue[index];
    const current = queue[minIndex];
    if (candidate.priority < current.priority || (candidate.priority === current.priority && candidate.node < current.node)) {
      minIndex = index;
    }
  }

  return queue.splice(minIndex, 1)[0];
}

function queueSnapshot(queue: QueueItem[]): QueueEntry[] {
  const bestByNode = new Map<number, QueueEntry>();
  for (const item of queue) {
    const current = bestByNode.get(item.node);
    if (!current || item.priority < current.priority) {
      bestByNode.set(item.node, {
        node: item.node,
        priority: Number(item.priority.toFixed(2)),
        cost: Number(item.cost.toFixed(2)),
        heuristic: item.heuristic === undefined ? undefined : Number(item.heuristic.toFixed(2)),
      });
    }
  }

  return [...bestByNode.values()].sort((left, right) => left.priority - right.priority || left.node - right.node);
}

function reconstructPath(previous: Map<number, number>, source: number, target: number): number[] {
  const path = [target];
  let current = target;

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

function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : undefined;
}

function buildNodeMetrics({
  algorithm,
  nodes,
  currentNode,
  queue,
  visited,
  previous,
  distances,
  heuristics,
  path = [],
}: {
  algorithm: AlgorithmKey;
  nodes: GraphNode[];
  currentNode?: number;
  queue: QueueItem[];
  visited: Set<number>;
  previous: Map<number, number>;
  distances: Map<number, number>;
  heuristics?: Map<number, number>;
  path?: number[];
}): NodeMetric[] {
  const queued = new Set(queue.map((item) => item.node));
  const pathSet = new Set(path);

  return nodes.map((node) => {
    const distance = distances.get(node.id) ?? Number.POSITIVE_INFINITY;
    const hCost = heuristics?.get(node.id) ?? 0;
    const status: NodeMetric["status"] = pathSet.has(node.id)
      ? "path"
      : currentNode === node.id
        ? "current"
        : visited.has(node.id)
          ? "visited"
          : queued.has(node.id)
            ? "queued"
            : "unvisited";

    return {
      node: node.id,
      status,
      distance: algorithm === "dijkstra" ? finiteOrUndefined(distance) : undefined,
      previous: previous.get(node.id),
      gCost: algorithm === "aStar" ? finiteOrUndefined(distance) : undefined,
      hCost: algorithm === "aStar" ? Number(hCost.toFixed(2)) : undefined,
      fCost: algorithm === "aStar" && Number.isFinite(distance) ? Number((distance + hCost).toFixed(2)) : undefined,
    };
  });
}

function pushTraceStep(
  traceSteps: AlgorithmTraceStep[],
  step: Omit<AlgorithmTraceStep, "stepIndex">
): void {
  traceSteps.push({
    ...step,
    stepIndex: traceSteps.length,
  });
}

function haversineKm(from: GraphNode, to: GraphNode): number {
  const radius = 6371;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function calculateHeuristicScale(nodes: GraphNode[], edges: GraphEdge[]): number {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ratios = edges.flatMap((edge) => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) {
      return [];
    }

    const distance = haversineKm(from, to);
    return distance > 0 ? [edge.weight / distance] : [];
  });

  return ratios.length > 0 ? Math.max(0, Math.min(...ratios) * 0.95) : 0;
}

function buildHeuristics(nodes: GraphNode[], target: number, scale: number): Map<number, number> {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const targetNode = nodeById.get(target);
  const heuristics = new Map<number, number>();

  for (const node of nodes) {
    const value = targetNode && node.id !== target ? haversineKm(node, targetNode) * scale : 0;
    heuristics.set(node.id, Number(value.toFixed(4)));
  }

  return heuristics;
}

function solveDijkstraMock(request: SolveRequest): SolveResult {
  const startedAt = performance.now();
  const adjacency = buildAdjacency(request.edges, request.directed);
  const distances = new Map(request.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<number, number>();
  const visited = new Set<number>();
  const queue: QueueItem[] = [{ node: request.source, priority: 0, cost: 0 }];
  const visitedOrder: number[] = [];
  const relaxedEdges: SolveResult["relaxedEdges"] = [];
  const traceSteps: AlgorithmTraceStep[] = [];

  distances.set(request.source, 0);

  while (queue.length > 0) {
    const currentItem = popMin(queue);
    if (!currentItem || visited.has(currentItem.node)) {
      continue;
    }

    const current = currentItem.node;
    visited.add(current);
    visitedOrder.push(current);
    pushTraceStep(traceSteps, {
      phase: "select-current",
      currentNode: current,
      queue: queueSnapshot(queue),
      nodes: buildNodeMetrics({
        algorithm: "dijkstra",
        nodes: request.nodes,
        currentNode: current,
        queue,
        visited,
        previous,
        distances,
      }),
      message: `Chọn node ${current} vì có dist nhỏ nhất (${currentItem.cost.toFixed(1)}).`,
    });

    if (current === request.target) {
      break;
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor.node)) {
        continue;
      }

      const nextDistance = (distances.get(current) ?? 0) + neighbor.weight;
      if (nextDistance < (distances.get(neighbor.node) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor.node, nextDistance);
        previous.set(neighbor.node, current);
        queue.push({ node: neighbor.node, priority: nextDistance, cost: nextDistance });
        relaxedEdges.push({
          from: current,
          to: neighbor.node,
          cumulativeCost: Number(nextDistance.toFixed(2)),
        });
        pushTraceStep(traceSteps, {
          phase: "relax-edge",
          currentNode: current,
          relaxedEdge: {
            id: neighbor.edge.id,
            from: current,
            to: neighbor.node,
            weight: neighbor.weight,
            cumulativeCost: Number(nextDistance.toFixed(2)),
          },
          queue: queueSnapshot(queue),
          nodes: buildNodeMetrics({
            algorithm: "dijkstra",
            nodes: request.nodes,
            currentNode: current,
            queue,
            visited,
            previous,
            distances,
          }),
          message: `Relax cạnh ${current} → ${neighbor.node}: cập nhật dist = ${nextDistance.toFixed(1)}.`,
        });
      }
    }
  }

  const path = reconstructPath(previous, request.source, request.target);
  const totalCost = calculatePathCost(path, request.edges, request.directed);
  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: request.target,
    queue: queueSnapshot(queue),
    nodes: buildNodeMetrics({
      algorithm: "dijkstra",
      nodes: request.nodes,
      currentNode: request.target,
      queue,
      visited,
      previous,
      distances,
      path,
    }),
    message: `Dựng lại shortest path: ${path.join(" → ")}.`,
  });

  const elapsed = performance.now() - startedAt;
  return {
    path,
    totalCost,
    runtimeMs: Number(Math.max(elapsed, DIJKSTRA_MIN_RUNTIME_MS).toFixed(2)),
    visitedOrder,
    relaxedEdges,
    traceSteps,
  };
}

function solveAStarMock(request: SolveRequest): SolveResult {
  const startedAt = performance.now();
  const adjacency = buildAdjacency(request.edges, request.directed);
  const scale = calculateHeuristicScale(request.nodes, request.edges);
  const heuristics = buildHeuristics(request.nodes, request.target, scale);
  const gScores = new Map(request.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<number, number>();
  const visited = new Set<number>();
  const sourceHeuristic = heuristics.get(request.source) ?? 0;
  const queue: QueueItem[] = [{ node: request.source, priority: sourceHeuristic, cost: 0, heuristic: sourceHeuristic }];
  const visitedOrder: number[] = [];
  const relaxedEdges: SolveResult["relaxedEdges"] = [];
  const traceSteps: AlgorithmTraceStep[] = [];

  gScores.set(request.source, 0);

  while (queue.length > 0) {
    const currentItem = popMin(queue);
    if (!currentItem || visited.has(currentItem.node)) {
      continue;
    }

    const current = currentItem.node;
    visited.add(current);
    visitedOrder.push(current);
    pushTraceStep(traceSteps, {
      phase: "select-current",
      currentNode: current,
      queue: queueSnapshot(queue),
      nodes: buildNodeMetrics({
        algorithm: "aStar",
        nodes: request.nodes,
        currentNode: current,
        queue,
        visited,
        previous,
        distances: gScores,
        heuristics,
      }),
      message: `Chọn node ${current} vì f(n) nhỏ nhất (${currentItem.priority.toFixed(1)}).`,
    });

    if (current === request.target) {
      break;
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor.node)) {
        continue;
      }

      const tentativeG = (gScores.get(current) ?? 0) + neighbor.weight;
      if (tentativeG < (gScores.get(neighbor.node) ?? Number.POSITIVE_INFINITY)) {
        const hCost = heuristics.get(neighbor.node) ?? 0;
        const fCost = tentativeG + hCost;
        gScores.set(neighbor.node, tentativeG);
        previous.set(neighbor.node, current);
        queue.push({ node: neighbor.node, priority: fCost, cost: tentativeG, heuristic: hCost });
        relaxedEdges.push({
          from: current,
          to: neighbor.node,
          cumulativeCost: Number(tentativeG.toFixed(2)),
        });
        pushTraceStep(traceSteps, {
          phase: "relax-edge",
          currentNode: current,
          relaxedEdge: {
            id: neighbor.edge.id,
            from: current,
            to: neighbor.node,
            weight: neighbor.weight,
            cumulativeCost: Number(tentativeG.toFixed(2)),
          },
          queue: queueSnapshot(queue),
          nodes: buildNodeMetrics({
            algorithm: "aStar",
            nodes: request.nodes,
            currentNode: current,
            queue,
            visited,
            previous,
            distances: gScores,
            heuristics,
          }),
          message: `Relax ${current} → ${neighbor.node}: g=${tentativeG.toFixed(1)}, h=${hCost.toFixed(1)}, f=${fCost.toFixed(1)}.`,
        });
      }
    }
  }

  const path = reconstructPath(previous, request.source, request.target);
  const totalCost = calculatePathCost(path, request.edges, request.directed);
  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: request.target,
    queue: queueSnapshot(queue),
    nodes: buildNodeMetrics({
      algorithm: "aStar",
      nodes: request.nodes,
      currentNode: request.target,
      queue,
      visited,
      previous,
      distances: gScores,
      heuristics,
      path,
    }),
    message: `A* hoàn tất path: ${path.join(" → ")}.`,
  });

  const elapsed = performance.now() - startedAt;
  return {
    path,
    totalCost,
    runtimeMs: Number(Math.max(elapsed, A_STAR_MIN_RUNTIME_MS).toFixed(2)),
    visitedOrder,
    relaxedEdges,
    traceSteps,
  };
}

export const solverClient = {
  async solveDijkstra(request: SolveRequest): Promise<SolveResult> {
    assertValidRequest(request);
    await delay(520);
    return solveDijkstraMock(request);
  },

  async solveAStar(request: SolveRequest): Promise<SolveResult> {
    assertValidRequest(request);
    await delay(430);
    return solveAStarMock(request);
  },
};
