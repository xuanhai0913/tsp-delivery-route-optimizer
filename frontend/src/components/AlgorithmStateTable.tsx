import type { AlgorithmKey, RoutePlaybackSnapshot } from "../types/path";
import { getResultLabel } from "../utils/route";

type AlgorithmStateTableProps = {
  algorithm: AlgorithmKey;
  snapshot: RoutePlaybackSnapshot;
};

function formatMetric(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "∞";
  }

  return value.toFixed(1);
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    unvisited: "Chưa xét",
    queued: "Trong queue",
    visited: "Đã chốt",
    current: "Đang xét",
    path: "Final path",
  };

  return labels[status] ?? status;
}

export function AlgorithmStateTable({ algorithm, snapshot }: AlgorithmStateTableProps) {
  const step = snapshot.currentTraceStep ?? snapshot.completedTraceSteps.at(-1);
  const nodes = step?.nodes ?? [];
  const isAStar = algorithm === "aStar";

  return (
    <section className="algorithm-state-panel" aria-label="Bảng trạng thái thuật toán">
      <div className="state-panel-head">
        <div>
          <span>Algorithm state</span>
          <h3>{getResultLabel(algorithm)}</h3>
        </div>
        <strong>{step ? `Step ${step.stepIndex + 1}` : "No trace"}</strong>
      </div>

      {step ? <p className="trace-message">{step.message}</p> : null}

      <div className="state-table-wrap">
        <table className="state-table">
          <thead>
            <tr>
              <th>Node</th>
              {isAStar ? (
                <>
                  <th>g(n)</th>
                  <th>h(n)</th>
                  <th>f(n)</th>
                </>
              ) : (
                <th>Dist</th>
              )}
              <th>Prev</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.node} className={`state-row ${node.status}`}>
                <td>{node.node}</td>
                {isAStar ? (
                  <>
                    <td>{formatMetric(node.gCost)}</td>
                    <td>{formatMetric(node.hCost)}</td>
                    <td>{formatMetric(node.fCost)}</td>
                  </>
                ) : (
                  <td>{formatMetric(node.distance)}</td>
                )}
                <td>{node.previous ?? "--"}</td>
                <td>
                  <span className={`status-pill ${node.status}`}>{statusLabel(node.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
