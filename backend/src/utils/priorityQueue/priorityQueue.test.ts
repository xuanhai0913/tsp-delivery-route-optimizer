// backend/src/utils/priorityQueue.test.ts
import { describe, it, expect } from "vitest";
import { MinPriorityQueue } from "./priorityQueue.js";

describe("MinPriorityQueue Data Structure", () => {
  it("Phải nhả ra phần tử có priority (chi phí) nhỏ nhất trước tiên", () => {
    // Khởi tạo hàng đợi, kiểu dữ liệu lưu trữ là string (ID của Node)
    const pq = new MinPriorityQueue<string>();

    // Giả lập đẩy các node với f(n) lộn xộn vào
    pq.push("Node_5", 5.5);
    pq.push("Node_2", 3.3);
    pq.push("Node_0", 3.9);
    pq.push("Node_6", 0.5);
    pq.push("Node_3", 4.7);

    // Kiểm tra xem nó có rút ra đúng thứ tự từ nhỏ đến lớn không
    expect(pq.popMin()?.item).toBe("Node_6"); // 0.5 nhỏ nhất
    expect(pq.popMin()?.item).toBe("Node_2"); // 3.3
    expect(pq.popMin()?.item).toBe("Node_0"); // 3.9
    expect(pq.popMin()?.item).toBe("Node_3"); // 4.7
    expect(pq.popMin()?.item).toBe("Node_5"); // 5.5

    // Khi rỗng thì phải báo true
    expect(pq.isEmpty()).toBe(true);
  });
});
