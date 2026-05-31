import type { RoadScenario } from "../types/path";

export const roadScenarios: RoadScenario[] = [
  {
    key: "normal",
    label: "Bình thường",
    description: "Giữ trọng số graph gốc.",
    affectedEdgeIds: [],
  },
  {
    key: "rain",
    label: "Mưa lớn",
    description: "Tăng 15% chi phí toàn mạng đường.",
    affectedEdgeIds: [],
    weightMultiplier: 1.15,
  },
  {
    key: "rushHour",
    label: "Giờ cao điểm",
    description: "Một số trục trung tâm bị kẹt, chi phí tăng mạnh.",
    affectedEdgeIds: ["e2-3", "e3-5", "e3-6"],
    weightMultiplier: 2.2,
  },
  {
    key: "blockedRoad",
    label: "Chặn đường",
    description: "Đoạn e3-6 bị loại khỏi graph để thuật toán tìm đường né.",
    affectedEdgeIds: ["e3-6"],
    blockedEdgeIds: ["e3-6"],
  },
];

export const defaultRoadScenario = roadScenarios[0];
