// backend/src/utils/path.test.ts
import { describe, it, expect } from "vitest";
import { reconstructPath } from "./path.js";

describe("reconstructPath Utility", () => {
  it("Nên truy vết chính xác đường đi từ Đích dò ngược về Nguồn", () => {
    // Giả lập dữ liệu mà A* đã lưu lại được:
    // Để đến 6 phải đi qua 3. Để đến 3 phải đi qua 2. Để đến 2 phải đi qua 1.
    const previous = new Map<number, number>();
    previous.set(6, 3);
    previous.set(3, 2);
    previous.set(2, 1);

    // Gọi hàm truy vết bắt đầu từ Target = 6
    const path = reconstructPath(previous, 6);

    // Kết quả mong đợi phải bị lật ngược lại thành tuyến đường đi tiến: [1, 2, 3, 6]
    expect(path).toEqual([1, 2, 3, 6]);
  });
});
