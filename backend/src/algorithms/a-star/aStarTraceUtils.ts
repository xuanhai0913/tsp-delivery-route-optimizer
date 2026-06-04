import type {
  GraphNode,
  GraphEdge,
  PathSolveResult,
} from "../../types/path.js";

export type TraceStep = NonNullable<PathSolveResult["traceSteps"]>[number];
export type QueueEntry = TraceStep["queue"][number];
export type NodeMetric = TraceStep["nodes"][number];

export type QueueNode = {
  nodeId: number;
  gScore: number;
};

export type TraceQueueNode = QueueNode & {
  hScore: number;
  fScore: number;
  sequence: number;
};

export type TraceNeighborEdge = {
  nodeId: number;
  weight: number;
  edge: GraphEdge;
};

export function getTraceNeighborEdges(
  nodeId: number,
  edges: GraphEdge[],
  directed: boolean,
): TraceNeighborEdge[] {
  return edges
    .flatMap((edge) => {
      if (edge.from === nodeId)
        return [{ nodeId: edge.to, weight: edge.weight, edge }];
      if (!directed && edge.to === nodeId)
        return [{ nodeId: edge.from, weight: edge.weight, edge }];
      return [];
    })
    .sort(
      (left, right) => left.weight - right.weight || left.nodeId - right.nodeId,
    );
}

export function removeTraceQueueNode(
  queueNodes: TraceQueueNode[],
  node: TraceQueueNode,
): void {
  const index = queueNodes.findIndex(
    (candidate) => candidate.sequence === node.sequence,
  );
  if (index >= 0) queueNodes.splice(index, 1);
}

export function traceQueueSnapshot(
  queueNodes: TraceQueueNode[],
  gScores: Map<number, number>,
): QueueEntry[] {
  const bestByNode = new Map<number, QueueEntry>();

  for (const item of queueNodes) {
    const bestKnownG = gScores.get(item.nodeId) ?? Number.POSITIVE_INFINITY;
    if (item.gScore > bestKnownG) continue;

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

export function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : undefined;
}

export function buildTraceNodeMetrics({
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
      .filter(
        (item) =>
          item.gScore <= (gScores.get(item.nodeId) ?? Number.POSITIVE_INFINITY),
      )
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
      fCost: Number.isFinite(gCost)
        ? Number((gCost + hCost).toFixed(2))
        : undefined,
    };
  });
}

export function pushTraceStep(
  traceSteps: NonNullable<PathSolveResult["traceSteps"]>,
  step: Omit<TraceStep, "stepIndex">,
): void {
  traceSteps.push({ ...step, stepIndex: traceSteps.length });
}
