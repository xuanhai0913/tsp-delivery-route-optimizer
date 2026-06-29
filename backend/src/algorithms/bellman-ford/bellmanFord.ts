import { performance } from "node:perf_hooks";
import type { GraphEdge, PathSolveRequest, PathSolveResult } from "../../types/path.js";
import { calculatePathCost } from "../../utils/route.js";

// ============================================================
// 1. Định nghĩa lỗi chu trình âm
// ============================================================
export class NegativeCycleError extends Error {
  status = 400;
  constructor(public nodeId: number) {
    super(`Bellman-Ford detected a negative cycle involving node ${nodeId}.`);
    this.name = "NegativeCycleError";
  }
}

// ============================================================
// 2. Helper: lấy danh sách cạnh kề (tương tự Dijkstra)
// ============================================================
type NeighborEdge = { nodeId: number; weight: number; edge: GraphEdge };

function getNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean
): NeighborEdge[] {
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
    .sort((a, b) => a.weight - b.weight || a.nodeId - b.nodeId);
}

// ============================================================
// 3. Hàm dựng lại đường đi (giống Dijkstra)
// ============================================================
function reconstructPath(
  previous: Map<number, number>,
  source: number,
  target: number
): number[] {
  if (source === target) return [source];
  if (!previous.has(target)) return [];

  const path: number[] = [target];
  let current = target;
  while (current !== source) {
    const parent = previous.get(current);
    if (parent === undefined) return [];
    path.unshift(parent);
    current = parent;
  }
  return path;
}

// ============================================================
// 4. Helper xây dựng node metrics cho trace (giống Dijkstra)
// ============================================================
type NodeMetric = NonNullable<PathSolveResult["traceSteps"]>[number]["nodes"][number];

function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : undefined;
}

function buildNodeMetrics({
  nodeIds,
  distances,
  previous,
  path = [],
}: {
  nodeIds: number[];
  distances: Map<number, number>;
  previous: Map<number, number>;
  path?: number[];
}): NodeMetric[] {
  const pathSet = new Set(path);
  return nodeIds.map((node) => {
    const status: NodeMetric["status"] = pathSet.has(node)
      ? "path"
      : Number.isFinite(distances.get(node) ?? Infinity)
      ? "visited"
      : "unvisited";
    return {
      node,
      status,
      distance: finiteOrUndefined(distances.get(node) ?? Infinity),
      previous: previous.get(node),
    };
  });
}

// ============================================================
// 5. Hàm push trace step (giống các solver khác)
// ============================================================
function pushTraceStep(
  traceSteps: NonNullable<PathSolveResult["traceSteps"]>,
  step: Omit<NonNullable<PathSolveResult["traceSteps"]>[number], "stepIndex">
): void {
  traceSteps.push({ ...step, stepIndex: traceSteps.length });
}

// ============================================================
// 6. Hàm tiện ích: chỉ trả path (cho test nhanh)
// ============================================================
export function bellmanFord(
  nodes: PathSolveRequest["nodes"],
  edges: GraphEdge[],
  source: number,
  target: number,
  directed = false
): number[] {
  return solveBellmanFord({ source, target, nodes, edges, directed }).path;
}

// ============================================================
// 7. HÀM CHÍNH: solveBellmanFord
// ============================================================
export function solveBellmanFord(request: PathSolveRequest): PathSolveResult {
  const startedAt = performance.now();

  const directed = request.directed ?? false;
  const nodeIds = request.nodes.map((n) => n.id);
  const source = request.source;
  const target = request.target;

  // --- 7a. Khởi tạo distances và previous ---
  const distances = new Map<number, number>();
  const previous = new Map<number, number>();
  for (const node of request.nodes) {
    distances.set(node.id, Infinity);
  }
  distances.set(source, 0);

  const relaxedEdges: NonNullable<PathSolveResult["relaxedEdges"]> = [];
  const visitedOrder: number[] = [source];
  const visitedSet = new Set<number>([source]);
  const traceSteps: NonNullable<PathSolveResult["traceSteps"]> = [];

  // --- 7b. Vòng lặp chính: lặp |V| - 1 lần ---
  const V = nodeIds.length;

  for (let iteration = 1; iteration <= V - 1; iteration++) {
    let anyRelaxed = false;

    for (const edge of request.edges) {
      const from = edge.from;
      const to = edge.to;
      const weight = edge.weight;

      // Xử lý cạnh có hướng / vô hướng
      const edgePairs: Array<{ from: number; to: number; weight: number }> = [
        { from, to, weight },
      ];
      if (!directed) {
        edgePairs.push({ from: to, to: from, weight });
      }

      for (const pair of edgePairs) {
        const distFrom = distances.get(pair.from) ?? Infinity;
        const distTo = distances.get(pair.to) ?? Infinity;

        if (distFrom + pair.weight < distTo) {
          distances.set(pair.to, distFrom + pair.weight);
          previous.set(pair.to, pair.from);
          anyRelaxed = true;
        if (!visitedSet.has(pair.to)) {
          visitedSet.add(pair.to);
          visitedOrder.push(pair.to);
        }

          const cumulativeCost = Number((distFrom + pair.weight).toFixed(2));
          relaxedEdges.push({
            from: pair.from,
            to: pair.to,
            cumulativeCost,
          });

          // Ghi trace step
          pushTraceStep(traceSteps, {
            phase: "relax-edge",
            currentNode: pair.from,
            relaxedEdge: {
              id: edge.id,
              from: pair.from,
              to: pair.to,
              weight: pair.weight,
              cumulativeCost,
            },
            queue: [], // Bellman-Ford không dùng queue
            nodes: buildNodeMetrics({
              nodeIds,
              distances,
              previous,
            }),
            message: `Bellman-Ford lần ${iteration}: relax cạnh ${pair.from} → ${pair.to}, dist[${pair.to}] = ${cumulativeCost}`,
          });
        }
      }
    }

    // Nếu không có relax nào, có thể dừng sớm (tối ưu)
    if (!anyRelaxed) break;

    // Ghi visitedOrder (mỗi lần lặp là một bước)
    visitedOrder.push(iteration);
  }

  // --- 7c. PHÁT HIỆN CHU TRÌNH ÂM ---
  // Chạy thêm một vòng lặp nữa, nếu còn relax được → có chu trình âm
  for (const edge of request.edges) {
    const from = edge.from;
    const to = edge.to;
    const weight = edge.weight;

    const edgePairs: Array<{ from: number; to: number; weight: number }> = [
      { from, to, weight },
    ];
    if (!directed) {
      edgePairs.push({ from: to, to: from, weight });
    }

    for (const pair of edgePairs) {
      const distFrom = distances.get(pair.from) ?? Infinity;
      const distTo = distances.get(pair.to) ?? Infinity;

      if (distFrom + pair.weight < distTo) {
        // Phát hiện chu trình âm! Ném lỗi với node liên quan
        throw new NegativeCycleError(pair.to);
      }
    }
  }

  // --- 7d. Dựng đường đi và kết quả ---
  const path = reconstructPath(previous, source, target);
  const totalCost = path.length > 0
    ? calculatePathCost(path, request.edges, directed)
    : 0;

  // Trace final
  pushTraceStep(traceSteps, {
    phase: "final-path",
    currentNode: path.length > 0 ? target : undefined,
    queue: [],
    nodes: buildNodeMetrics({
      nodeIds,
      distances,
      previous,
      path,
    }),
    message: path.length > 0
      ? `Bellman-Ford tìm được path: ${path.join(" → ")}`
      : `Không tìm thấy đường đi từ ${source} đến ${target}`,
  });

  // --- 7e. Trả về kết quả ---
  return {
    path,
    totalCost,
    runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
    visitedOrder,
    relaxedEdges,
    traceSteps,
  };
}