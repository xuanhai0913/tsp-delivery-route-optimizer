// backend/src/utils/heuristic.ts
import type { GraphNode } from "../../types/path.js";
import { haversineDistance } from "../haversine/haversine.js";

//   Ước lượng chi phí từ node hiện tại đến đích.
//   Chúng ta sử dụng khoảng cách chim bay nhân với một hệ số (thường là 0.55).
export const calculateHeuristic = (
  currentNode: GraphNode,
  targetNode: GraphNode,
): number => {
  // Khoảng cách chim bay là ước lượng tốt nhất (Admissible Heuristic)
  const distance = haversineDistance(
    currentNode.lat,
    currentNode.lng,
    targetNode.lat,
    targetNode.lng,
  );

  // Hệ số bảo thủ giúp heuristic chỉ đóng vai trò định hướng, không thay cost thật.
  const conservativeScale = 0.55;

  return Number((distance * conservativeScale).toFixed(3));
};
