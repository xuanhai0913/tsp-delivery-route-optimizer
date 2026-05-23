import type { GraphNode, GraphEdge } from "../../types/path.js";
import { MinPriorityQueue } from "../../utils/priorityQueue/priorityQueue.js";
import { calculateHeuristic } from "../../utils/heuristic/heuristic.js";
import { reconstructPath } from "../../utils/path/path.js";

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
      continue;
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

  return gScores.has(endId) ? reconstructPath(previous, endId) : []; // không tìm thấy đường đi
};
