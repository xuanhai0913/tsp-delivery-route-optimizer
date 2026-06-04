import { describe, it, expect } from "vitest";
import {
  calculateHeuristic,
  calculateHeuristicScale,
  buildTraceHeuristics,
} from "./heuristic.js";
import type { GraphNode, GraphEdge } from "../../types/path.js";

describe("Heuristic Utility", () => {
  it("Phải trả về 0 nếu khoảng cách từ điểm hiện tại đến đích là 0 (cùng tọa độ)", () => {
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.777, lng: 106.6953 };
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.777, lng: 106.6953 };

    const h = calculateHeuristic(nodeA, nodeB);
    expect(h).toBe(0);
  });

  it("Phải trả về giá trị dương khi hai điểm khác nhau", () => {
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.7626, lng: 106.6602 };
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.77, lng: 106.67 };

    const h = calculateHeuristic(nodeA, nodeB);
    expect(h).toBeGreaterThan(0);
  });

  it("Kết quả phải khớp với khoảng cách Haversine khi hệ số scale = 0.55", () => {
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.7725, lng: 106.698 };
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.7866, lng: 106.7057 };

    const h = calculateHeuristic(nodeA, nodeB);
    expect(h).toBeGreaterThan(0.5);
    expect(h).toBeLessThan(1);
  });

  // --- THÊM CÁC BÀI TEST CHO CÁC HÀM TÍNH TOÁN SCALE ĐỘNG Ở ĐÂY ---

  it("calculateHeuristicScale phải tính toán hệ số scale an toàn dựa trên đồ thị thực tế", () => {
    const testNodes: GraphNode[] = [
      { id: 1, name: "A", lat: 0, lng: 0 },
      { id: 2, name: "B", lat: 0, lng: 1 }, // Khoảng cách khoảng ~111.19km
    ];
    const testEdges: GraphEdge[] = [{ id: "1-2", from: 1, to: 2, weight: 112 }];

    const scale = calculateHeuristicScale(testNodes, testEdges);
    expect(scale).toBeGreaterThan(0);
    // Đảm bảo hệ số scale nhân với khoảng cách không vượt quá weight gốc (tính chất Admissible)
    expect(scale).toBeLessThanOrEqual(112 / 111.19);
  });

  it("buildTraceHeuristics phải trả về bảng Map chứa chi phí ước lượng chính xác đến đích", () => {
    const testNodes: GraphNode[] = [
      { id: 1, name: "A", lat: 0, lng: 0 },
      { id: 2, name: "B", lat: 0, lng: 1 },
    ];
    const testEdges: GraphEdge[] = [{ id: "1-2", from: 1, to: 2, weight: 112 }];

    const targetNode = testNodes[1]; // Điểm B là đích
    const heuristicsMap = buildTraceHeuristics(
      testNodes,
      targetNode,
      testEdges,
    );

    expect(heuristicsMap.get(2)).toBe(0); // Tại đích, h(B) phải bắt buộc bằng 0
    expect(heuristicsMap.get(1)).toBeGreaterThan(0); // Tại điểm xuất phát, h(A) phải lớn hơn 0
  });
});
