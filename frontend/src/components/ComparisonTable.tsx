import type { ComparisonRow } from "../types/path";
import { pathToLabel } from "../utils/route";

type ComparisonTableProps = {
  rows: ComparisonRow[];
};

export function ComparisonTable({ rows }: ComparisonTableProps) {
  if (rows.length === 0) {
    return <p className="empty-state">Chưa có kết quả để so sánh. Hãy chạy Dijkstra hoặc A*.</p>;
  }

  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table" aria-label="Bảng so sánh hiệu suất shortest path">
        <thead>
          <tr>
            <th>Thuật toán</th>
            <th>Path</th>
            <th>Tổng chi phí</th>
            <th>Runtime (ms)</th>
            <th>Visited</th>
            <th>Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.algorithm}>
              <td>
                <strong>{row.name}</strong>
              </td>
              <td className="route-cell">{pathToLabel(row.path)}</td>
              <td className={row.isBestCost ? "best-cell" : ""}>
                {row.totalCost}
                {row.isBestCost ? <span>Ngắn nhất</span> : null}
              </td>
              <td className={row.isFastest ? "best-cell" : ""}>
                {row.runtimeMs}
                {row.isFastest ? <span>Nhanh nhất</span> : null}
              </td>
              <td>{row.visitedCount}</td>
              <td>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
