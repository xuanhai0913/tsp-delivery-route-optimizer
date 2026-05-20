import type { ComparisonRow } from "../types/tsp";

type ComparisonTableProps = {
  rows: ComparisonRow[];
};

export function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <div className="comparison-wrap">
      <table className="comparison-table" aria-label="Bảng so sánh hiệu suất">
        <thead>
          <tr>
            <th>Thuật toán</th>
            <th>Lộ trình</th>
            <th>Tổng chi phí (km)</th>
            <th>Thời gian chạy (ms)</th>
            <th>Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.algorithm}>
                <td>
                  <span className={`algorithm-dot ${row.algorithm}`} />
                  <strong>{row.name}</strong>
                </td>
                <td className="route-cell">{row.route.join(" → ")}</td>
                <td className={row.isBestCost ? "highlight-cost" : ""}>
                  {row.totalCost.toFixed(1)}
                  {row.isBestCost ? <span className="tiny-badge">Ngắn nhất</span> : null}
                </td>
                <td className={row.isFastest ? "highlight-fast" : ""}>
                  {row.runtimeMs.toFixed(0)}
                  {row.isFastest ? <span className="tiny-badge">Nhanh nhất</span> : null}
                </td>
                <td>{row.note}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="empty-table-cell">
                Chưa có kết quả. Hãy chạy Greedy, Branch and Bound hoặc chạy cả hai.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
