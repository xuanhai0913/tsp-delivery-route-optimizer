import type { AlgorithmKey } from "../types/path";

export type SolveEndpoint = "/api/solve/dijkstra" | "/api/solve/a-star" | "/api/solve/floyd-warshall" | "/api/solve/bellman-ford";

export type AlgorithmConfig = {
  key: AlgorithmKey;
  /** Full display label, e.g. "Floyd-Warshall". */
  label: string;
  /** Compact label used in chips/legends. */
  shortLabel: string;
  /** Big-O complexity tag shown next to the radio option. */
  complexity: string;
  /** Route color used on the map, graph, legend and result cards. */
  color: string;
  /** Backend endpoint for this algorithm. */
  endpoint: SolveEndpoint;
  /** Comparison note shown in the comparison table. */
  note: string;
};

/**
 * Single source of truth for every algorithm wired into the frontend.
 * Order here drives the order in the sidebar, legend and result cards.
 *
 * Bellman-Ford appears in the design mock but is intentionally omitted:
 * it is not implemented on the backend yet.
 */
export const ALGORITHMS: AlgorithmConfig[] = [
  {
    key: "dijkstra",
    label: "Dijkstra",
    shortLabel: "Dijkstra",
    complexity: "O((V+E)log V)",
    color: "#2563eb",
    endpoint: "/api/solve/dijkstra",
    note: "Duyệt chắc chắn với trọng số không âm, phù hợp làm baseline tối ưu.",
  },
  {
    key: "aStar",
    label: "A*",
    shortLabel: "A*",
    complexity: "O((V+E)log V)",
    color: "#7c3aed",
    endpoint: "/api/solve/a-star",
    note: "Dùng heuristic tọa độ để ưu tiên hướng gần đích, thường duyệt ít node hơn.",
  },
  {
    key: "floydWarshall",
    label: "Floyd-Warshall",
    shortLabel: "Floyd",
    complexity: "O(V³)",
    color: "#06b6d4",
    endpoint: "/api/solve/floyd-warshall",
    note: "Quy hoạch động tìm shortest path mọi cặp node, tốn O(V³) nhưng cho toàn bộ ma trận.",
  },
  {
    key: "bellmanFord",
    label: "Bellman-Ford",
    shortLabel: "Bellman",
    complexity: "O(VE)",
    color: "#ef4444",
    endpoint: "/api/solve/bellman-ford",
    note: "Xử lý trọng số âm và phát hiện chu trình âm, phù hợp đồ thị có cạnh âm.", 
  }
];

export const ALGORITHM_KEYS: AlgorithmKey[] = ALGORITHMS.map((item) => item.key);

const ALGORITHM_BY_KEY: Record<AlgorithmKey, AlgorithmConfig> = ALGORITHMS.reduce(
  (accumulator, config) => {
    accumulator[config.key] = config;
    return accumulator;
  },
  {} as Record<AlgorithmKey, AlgorithmConfig>
);

export function getAlgorithmConfig(algorithm: AlgorithmKey): AlgorithmConfig {
  return ALGORITHM_BY_KEY[algorithm];
}

export function getAlgorithmLabel(algorithm: AlgorithmKey): string {
  return ALGORITHM_BY_KEY[algorithm].label;
}

export function getAlgorithmColor(algorithm: AlgorithmKey): string {
  return ALGORITHM_BY_KEY[algorithm].color;
}
