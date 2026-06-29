import type { CSSProperties } from "react";
import type { AlgorithmKey, GraphNode, SolveResult } from "../types/path";
import { getAlgorithmConfig } from "../data/algorithms";
import { RouteChipList } from "./RouteChipList";

type ResultCardProps = {
  algorithm: AlgorithmKey;
  result?: SolveResult;
  nodes: GraphNode[];
  isLoading?: boolean;
  badges?: string[];
  activeStep?: number;
  activeNodeId?: number;
  isPlaybackTarget?: boolean;
  onSelectPlayback?: (algorithm: AlgorithmKey) => void;
};

export function ResultCard({
  algorithm,
  result,
  nodes,
  isLoading,
  badges = [],
  activeStep,
  activeNodeId,
  isPlaybackTarget,
  onSelectPlayback,
}: ResultCardProps) {
  const config = getAlgorithmConfig(algorithm);
  const title = config.label;
  const canSelect = Boolean(result && onSelectPlayback);

  return (
    <button
      className={[
        "result-card",
        algorithm,
        isLoading ? "loading" : "",
        isPlaybackTarget ? "playback-target" : "",
      ].join(" ")}
      type="button"
      disabled={!canSelect}
      style={{ "--algo-color": config.color } as CSSProperties}
      onClick={() => {
        if (canSelect) {
          onSelectPlayback?.(algorithm);
        }
      }}
    >
      <div className="result-header">
        <span className="result-dot" aria-hidden="true" />
        <h3>{title}</h3>
        <span className="result-tag">{config.complexity}</span>
        <span className="result-status">{isLoading ? "Đang chạy" : result ? "Hoàn thành" : "Chưa chạy"}</span>
      </div>

      {badges.length > 0 && result ? (
        <div className="result-badges">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      ) : null}

      <div className="result-metrics">
        <div>
          <span>Tổng chi phí</span>
          <strong>{result ? result.totalCost : "--"}</strong>
        </div>
        <div>
          <span>Runtime</span>
          <strong>{result ? `${result.runtimeMs} ms` : "--"}</strong>
        </div>
        <div>
          <span>Visited</span>
          <strong>{result ? result.visitedOrder?.length ?? result.path.length : "--"}</strong>
        </div>
      </div>

      <div className="route-section">
        <p>Path sequence:</p>
        {result ? (
          <RouteChipList
            path={result.path}
            nodes={nodes}
            algorithm={algorithm}
            activeStep={activeStep}
            activeNodeId={activeNodeId}
            isPlaybackTarget={isPlaybackTarget}
          />
        ) : (
          <span className="placeholder-line" />
        )}
      </div>
    </button>
  );
}
