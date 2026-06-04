import type { GraphNode, GraphEdge } from "../../types/path.js";
import { haversineDistance } from "../haversine/haversine.js";

// Tính toán hệ số tỷ lệ scale động dựa trên đồ thị để đảm bảo tính chất Admissible
export const calculateHeuristicScale = (
  nodes: GraphNode[],
  edges: GraphEdge[],
): number => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ratios = edges.flatMap((edge) => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) return [];

    const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    return distance > 0 ? [edge.weight / distance] : [];
  });

  return ratios.length > 0 ? Math.max(0, Math.min(...ratios) * 0.95) : 0;
};

// Hàm tính toán Heuristic gốc, hỗ trợ scale linh hoạt
export const calculateHeuristic = (
  currentNode: GraphNode,
  targetNode: GraphNode,
  scale: number = 0.55, // Dự phòng fallback 0.55 cho các bộ test cũ
): number => {
  const distance = haversineDistance(
    currentNode.lat,
    currentNode.lng,
    targetNode.lat,
    targetNode.lng,
  );

  return Number((distance * scale).toFixed(3));
};

// Hàm tạo bảng map Heuristic cho chức năng Tracing API
export const buildTraceHeuristics = (
  nodes: GraphNode[],
  targetNode: GraphNode,
  edges: GraphEdge[],
): Map<number, number> => {
  const scale = calculateHeuristicScale(nodes, edges);

  return new Map(
    nodes.map((node) => {
      const distance =
        node.id === targetNode.id
          ? 0
          : haversineDistance(
              node.lat,
              node.lng,
              targetNode.lat,
              targetNode.lng,
            );
      return [node.id, Number((distance * scale).toFixed(3))];
    }),
  );
};
