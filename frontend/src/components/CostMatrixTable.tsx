type CostMatrixTableProps = {
  matrix: number[][];
  start: number;
  compact?: boolean;
};

export function CostMatrixTable({ matrix, start, compact = false }: CostMatrixTableProps) {
  return (
    <div className={`matrix-scroll ${compact ? "compact" : ""}`}>
      <table className="matrix-table" aria-label="Ma trận chi phí">
        <thead>
          <tr>
            <th scope="col">ID</th>
            {matrix.map((_, columnIndex) => (
              <th
                key={columnIndex}
                scope="col"
                className={columnIndex === start ? "start-axis" : ""}
              >
                {columnIndex}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row" className={rowIndex === start ? "start-axis" : ""}>
                {rowIndex}
              </th>
              {row.map((value, columnIndex) => (
                <td
                  key={`${rowIndex}-${columnIndex}`}
                  className={[
                    rowIndex === columnIndex ? "diagonal" : "",
                    rowIndex === start || columnIndex === start ? "start-cross" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {value.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
