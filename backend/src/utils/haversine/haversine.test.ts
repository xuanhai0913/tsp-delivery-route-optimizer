// backend/src/utils/haversine.test.ts
import { describe, it, expect } from "vitest";
import { haversineDistance } from "./haversine.js";

describe("haversineDistance Utility", () => {
  it("Nên trả về 0 nếu tọa độ điểm A và điểm B giống hệt nhau", () => {
    const lat = 10.7725;
    const lng = 106.698;
    const distance = haversineDistance(lat, lng, lat, lng);
    expect(distance).toBe(0);
  });

  it("Nên tính chính xác khoảng cách Bến Thành -> Thảo Cầm Viên (sai số hợp lý)", () => {
    const lat1 = 10.7725,
      lng1 = 106.698; // Chợ Bến Thành
    const lat2 = 10.7875,
      lng2 = 106.7053; // Thảo Cầm Viên

    const distance = haversineDistance(lat1, lng1, lat2, lng2);

    // Khoảng cách thực tế là tầm 1.84 km. Test sẽ pass nếu kết quả nằm giữa 1.8 và 1.9
    expect(distance).toBeGreaterThan(1.8);
    expect(distance).toBeLessThan(1.9);
  });
});
