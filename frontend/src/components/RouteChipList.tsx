import type { AlgorithmKey, GraphNode } from "../types/path";

type RouteChipListProps = {
  path: number[];
  nodes: GraphNode[];
  algorithm: AlgorithmKey;
  activeStep?: number;
  activeNodeId?: number;
  isPlaybackTarget?: boolean;
};

export function RouteChipList({ path, nodes, algorithm, activeStep, activeNodeId, isPlaybackTarget }: RouteChipListProps) {
  const nodeById = new Map(nodes.map((node) => [node.id, node.name]));
  const activeNodeIndex =
    isPlaybackTarget && activeNodeId !== undefined
      ? path.findIndex((id) => id === activeNodeId)
      : isPlaybackTarget && activeStep !== undefined
        ? activeStep + 1
        : -1;

  return (
    <div className="route-chip-list" aria-label="Đường đi ngắn nhất">
      {path.map((nodeId, index) => (
        <span className="route-chip-wrap" key={`${nodeId}-${index}`}>
          <span
            className={[
              "route-chip",
              algorithm === "dijkstra" ? "dijkstra" : "astar",
              isPlaybackTarget && index < activeNodeIndex ? "visited" : "",
              isPlaybackTarget && index === activeNodeIndex ? "active" : "",
            ].join(" ")}
            title={nodeById.get(nodeId) ?? `Node ${nodeId}`}
          >
            {nodeId}
          </span>
          {index < path.length - 1 ? <span className="route-arrow">→</span> : null}
        </span>
      ))}
    </div>
  );
}
