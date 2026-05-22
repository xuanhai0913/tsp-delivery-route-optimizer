import { GraphNode } from "../../types/path.js";

// hàm để xuât ra đường đi từ node nguồn về node đích sau khi đã tìm được đường đi ngắn nhất

export const reconstructPath = (
  previous: Map<number, number>,
  targetId: number,
): number[] => {
  const path: number[] = [targetId];
  let currentID: number | undefined = targetId;

  // Dò ngược lại cho đến khi không còn dấu vết
  while (currentID !== undefined && previous.has(currentID)) {
    currentID = previous.get(currentID);
    if (currentID !== undefined) {
      path.unshift(currentID); // Đẩy Node cha lên đầu để có thứ tự Xuất phát -> Đích
    }
  }

  return path;
};
