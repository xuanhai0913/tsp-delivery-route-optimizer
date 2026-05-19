import { GitBranch, Zap } from "lucide-react";
import type { AlgorithmKey, Location, SolveResult } from "../types/tsp";
import { RouteChipList } from "./RouteChipList";

type ResultCardProps = {
  algorithm: AlgorithmKey;
  result?: SolveResult;
  locations: Location[];
  isLoading?: boolean;
};

export function ResultCard({ algorithm, result, locations, isLoading = false }: ResultCardProps) {
  const isGreedy = algorithm === "greedy";
  const title = isGreedy ? "Greedy (Tham lam)" : "Branch and Bound";
  const Icon = isGreedy ? Zap : GitBranch;

  return (
    <article className={`result-card ${isGreedy ? "greedy" : "branch"}`}>
      <div className="result-card-head">
        <div className="section-title-inline">
          <Icon size={22} />
          <h3>{title}</h3>
        </div>
        <span className={`status-pill ${result ? "done" : "idle"}`}>
          {isLoading ? "Đang chạy" : result ? (isGreedy ? "Hoàn thành" : "Tối ưu") : "Chưa chạy"}
        </span>
      </div>

      {isLoading ? (
        <div className="skeleton-block" aria-label={`${title} đang chạy`} />
      ) : result ? (
        <>
          <div className="metric-grid">
            <div>
              <span>Tổng chi phí (km)</span>
              <strong>{result.totalCost.toFixed(1)}</strong>
            </div>
            <div>
              <span>Thời gian chạy</span>
              <strong>{result.runtimeMs.toFixed(0)} ms</strong>
            </div>
          </div>
          <div className="route-section">
            <p>Lộ trình Sequence:</p>
            <RouteChipList
              route={result.route}
              locations={locations}
              tone={isGreedy ? "greedy" : "branch"}
            />
          </div>
        </>
      ) : (
        <div className="empty-result">
          Chạy thuật toán để xem route, tổng chi phí và thời gian.
        </div>
      )}
    </article>
  );
}
