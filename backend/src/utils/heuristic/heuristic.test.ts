import { describe, it, expect } from "vitest";
import { calculateHeuristic } from "./heuristic.js";
import type { GraphNode } from "../../types/path.js";

describe("Heuristic Utility", () => {
  it("Phải trả về 0 nếu khoảng cách từ điểm hiện tại đến đích là 0 (cùng tọa độ)", () => {
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.777, lng: 106.6953 };
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.777, lng: 106.6953 };

    const h = calculateHeuristic(nodeA, nodeB);
    expect(h).toBe(0);
  });

  it("Phải trả về giá trị dương khi hai điểm khác nhau", () => {
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.7626, lng: 106.6602 }; // Q1
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.77, lng: 106.67 }; // Q1 xa hơn một chút

    const h = calculateHeuristic(nodeA, nodeB);
    expect(h).toBeGreaterThan(0);
  });

  it("Kết quả phải khớp với khoảng cách Haversine khi hệ số scale = 0.55", () => {
    // Nếu bạn muốn check con số cụ thể, hãy dùng một cặp tọa độ biết trước kết quả
    const nodeA: GraphNode = { id: 1, name: "A", lat: 10.7725, lng: 106.698 };
    const nodeB: GraphNode = { id: 2, name: "B", lat: 10.7866, lng: 106.7057 };

    const h = calculateHeuristic(nodeA, nodeB);
    // 1 độ kinh/vĩ tuyến gần tương đương 111km
    expect(h).toBeGreaterThan(0.5);
    expect(h).toBeLessThan(1);
  });
});
