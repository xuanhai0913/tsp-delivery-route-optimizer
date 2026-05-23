import { describe, it, expect } from "vitest";
import { astar } from "./aStar.js";
import type { GraphNode, GraphEdge } from "../../types/path.js";

describe("A* Algorithm Comprehensive Tests", () => {
  const nodes: GraphNode[] = [
    { id: 1, name: "0", lat: 10.7798, lng: 106.699 },
    { id: 2, name: "1", lat: 10.7725, lng: 106.698 },
    { id: 3, name: "2", lat: 10.777, lng: 106.6953 },
    { id: 4, name: "3", lat: 10.7828, lng: 106.6955 },
    { id: 5, name: "4", lat: 10.789, lng: 106.6908 },
    { id: 6, name: "5", lat: 10.7794, lng: 106.692 },
    { id: 7, name: "6", lat: 10.7866, lng: 106.7057 }, // Đảo cô lập
    { id: 8, name: "D", lat: 10, lng: 10 }, // Đảo cô lập
    { id: 9, name: "A", lat: 0, lng: 0 }, // Đảo cô lập
    { id: 10, name: "B", lat: 0, lng: 1 }, // Đảo cô lập
    { id: 11, name: "C", lat: 0, lng: 2 }, // Đảo cô lập
  ];

  const edges: GraphEdge[] = [
    { id: "1-2", from: 1, to: 2, weight: 3.4 },
    { id: "1-3", from: 1, to: 3, weight: 2.1 },
    { id: "1-4", from: 1, to: 4, weight: 3.2 }, // Nhánh này dài hơn
    { id: "2-3", from: 2, to: 3, weight: 2.5 }, // Nhánh này dài hơn
    { id: "2-6", from: 2, to: 6, weight: 4.6 }, // Nhánh này dài hơn
    { id: "3-4", from: 3, to: 4, weight: 2.2 }, // Nhánh này dài hơn
    { id: "3-6", from: 3, to: 6, weight: 1.3 }, // Nhánh này dài hơn
    { id: "4-5", from: 4, to: 5, weight: 2.7 }, // Nhánh này dài hơn
    { id: "4-6", from: 4, to: 6, weight: 1.5 }, // Nhánh này dài hơn
    { id: "4-7", from: 4, to: 7, weight: 2.8 }, // Nhánh này dài hơn
    { id: "5-6", from: 5, to: 6, weight: 4 }, // Nhánh này dài hơn
    { id: "5-7", from: 5, to: 7, weight: 3.1 }, // Nhánh này dài hơn
    { id: "A-B", from: 9, to: 10, weight: 112 }, // Nhánh này dài hơn
    { id: "A-C", from: 9, to: 11, weight: 250 }, // Nhánh này dài hơn
    { id: "B-C", from: 10, to: 11, weight: 112 }, // Nhánh này dài hơn
  ];

  it("1. Nên tìm đường đi ngắn nhất 1", () => {
    const path = astar(nodes, edges, 2, 7);
    expect(path).toEqual([2, 3, 4, 7]);
  });
  it("2. Nên tìm đường đi ngắn nhất 2", () => {
    const path = astar(nodes, edges, 9, 11);
    expect(path).toEqual([9, 10, 11]);
  });

  it("3. Nên trả về rỗng nếu điểm đích không tồn tại", () => {
    const path = astar(nodes, edges, 1, 999);
    expect(path).toEqual([]);
  });

  it("4. Nên trả về rỗng nếu đích bị cô lập (không có đường tới)", () => {
    const path = astar(nodes, edges, 9, 8);
    expect(path).toEqual([]);
  });

  it("5. Nếu bắt đầu bằng đích, trả về chính nó", () => {
    const path = astar(nodes, edges, 1, 1);
    expect(path).toEqual([1]);
  });

  it("6. Nên đi được cạnh ngược chiều khi graph không có hướng", () => {
    const path = astar(nodes, edges, 7, 2);
    expect(path).toEqual([7, 4, 3, 2]);
  });

  it("7. Không nên đi ngược cạnh khi graph có hướng", () => {
    const path = astar(nodes, edges, 7, 2, true);
    expect(path).toEqual([]);
  });

  it("8. Nên cập nhật lại node nếu tìm được đường rẻ hơn sau khi đã đưa vào queue", () => {
    const staleQueueNodes: GraphNode[] = [
      { id: 20, name: "Start", lat: 0, lng: 0 },
      { id: 21, name: "Target", lat: 0, lng: 10 },
      { id: 22, name: "Connector", lat: 0, lng: 1 }
    ];
    const staleQueueEdges: GraphEdge[] = [
      { id: "20-21", from: 20, to: 21, weight: 10 },
      { id: "20-22", from: 20, to: 22, weight: 1 },
      { id: "22-21", from: 22, to: 21, weight: 1 }
    ];

    const path = astar(staleQueueNodes, staleQueueEdges, 20, 21, true);

    expect(path).toEqual([20, 22, 21]);
  });
});
