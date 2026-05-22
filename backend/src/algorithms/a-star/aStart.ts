import { GraphNode, GraphEdge } from "../../types/path.js";
import { MinPriorityQueue } from "../../utils/priorityQueue/priorityQueue.js";
import { calculateHeuristic } from "../../utils/heuristic/heuristic.js";
import { reconstructPath } from "../../utils/path/path.js";

// Thuật toán A* để tìm đường đi ngắn nhất

export const astar = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: number,
  endId: number,
): number[] => {
  // khởi tạo các giá trị cần thiết
  const startNode = nodes.find((node) => node.id === startId);
  const endNode = nodes.find((node) => node.id === endId);

  const gScores = new Map<number, number>(); // Chi phí từ start đến node hiện tại
  const fScores = new Map<number, number>(); // chi phí ước lượng từ start đến đích qua node hiện tại
  const previous = new Map<number, number>(); // Để truy vết đường đi
  const queue = new MinPriorityQueue<number>();

  if (!startNode || !endNode) {
    return [];
  }

  if (startId === endId) {
    return [startId];
  }

  // thiết lập giá trị ban đầu
  gScores.set(startId, 0);
  fScores.set(startId, calculateHeuristic(startNode, endNode));
  queue.push(startId, fScores.get(startId) || 0);

  // vòng lập thuật toán chính
  while (!queue.isEmpty()) {
    const currentId = queue.popMin()?.item;
    if (currentId === endId) {
      return reconstructPath(previous, endId);
    } // Đã tìm thấy đích
    if (currentId === undefined) {
      // Cách này giúp bạn biết ngay nếu thuật toán rơi vào trường hợp "không tưởng"
      throw new Error(
        "Thuật toán A*: Hàng đợi bị rỗng bất ngờ (Queue underflow)!",
      );
    }
    const neighbors = edges.filter((edge) => edge.from === currentId);
    for (const edge of neighbors) {
      const tentativeG = (gScores.get(currentId) || 0) + edge.weight;
      // kiểm tra xem đường đi mới này và đường đi cũ đến điểm kế tiếp đường nào tốt hơn nếu đường mới tốt hơn thì
      // cập nhật lại gScore và fScore của điểm kế tiếp và lưu lại điểm hiện tại là cha của điểm kế tiếp để sau này truy vết đường đi
      if (tentativeG < (gScores.get(edge.to) || Infinity)) {
        previous.set(edge.to, currentId);
        gScores.set(edge.to, tentativeG);
        const h = calculateHeuristic(
          nodes.find((node) => node.id === edge.to)!,
          endNode,
        );
        fScores.set(edge.to, tentativeG + h);
        queue.push(edge.to, fScores.get(edge.to) || 0);
      }
    }
  }
  return []; // không tìm thấy đường đi
};
