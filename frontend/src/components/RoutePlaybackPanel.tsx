import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { AlgorithmKey, Dataset, RoutePlaybackSnapshot } from "../types/tsp";
import { getResultLabel } from "../utils/route";

type RoutePlaybackPanelProps = {
  dataset: Dataset;
  availableAlgorithms: Record<AlgorithmKey, boolean>;
  selectedAlgorithm: AlgorithmKey;
  onAlgorithmChange: (algorithm: AlgorithmKey) => void;
  isPlaying: boolean;
  speed: number;
  speedOptions: readonly number[];
  onSpeedChange: (speed: number) => void;
  snapshot: RoutePlaybackSnapshot;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepNext: () => void;
  onStepPrevious: () => void;
};

function locationName(dataset: Dataset, id?: number) {
  if (id === undefined) {
    return "Chưa có điểm";
  }

  return dataset.locations.find((location) => location.id === id)?.name ?? `Điểm ${id}`;
}

export function RoutePlaybackPanel({
  dataset,
  availableAlgorithms,
  selectedAlgorithm,
  onAlgorithmChange,
  isPlaying,
  speed,
  speedOptions,
  onSpeedChange,
  snapshot,
  onTogglePlay,
  onReset,
  onStepNext,
  onStepPrevious,
}: RoutePlaybackPanelProps) {
  if (snapshot.segmentCount === 0) {
    return null;
  }

  const currentSegment = snapshot.currentSegment;
  const fromName = locationName(dataset, currentSegment?.from);
  const toName = locationName(dataset, currentSegment?.to);
  const stepLabel = snapshot.isComplete
    ? `${snapshot.segmentCount}/${snapshot.segmentCount}`
    : `${snapshot.activeStep + 1}/${snapshot.segmentCount}`;
  const progressPercent = Math.round(
    ((snapshot.completedStepCount + (snapshot.isComplete ? 0 : snapshot.segmentProgress)) /
      snapshot.segmentCount) *
      100
  );

  return (
    <div className="playback-panel" aria-label="Điều khiển mô phỏng lộ trình">
      <div className="playback-topline">
        <div>
          <span className="playback-kicker">Playback mode</span>
          <h3>
            {snapshot.isComplete
              ? "Route đã hoàn tất"
              : `Từ ${currentSegment?.from ?? "-"} → ${currentSegment?.to ?? "-"}`}
          </h3>
        </div>

        <div className="playback-algorithms" role="group" aria-label="Chọn thuật toán playback">
          {(["greedy", "branchAndBound"] as AlgorithmKey[]).map((algorithm) => (
            <button
              key={algorithm}
              type="button"
              disabled={!availableAlgorithms[algorithm]}
              className={selectedAlgorithm === algorithm ? `active ${algorithm}` : ""}
              onClick={() => onAlgorithmChange(algorithm)}
            >
              <span className={`algorithm-dot ${algorithm}`} />
              {algorithm === "greedy" ? "Greedy" : "Branch & Bound"}
            </button>
          ))}
        </div>
      </div>

      <div className="playback-controls">
        <button type="button" className="icon-control" onClick={onStepPrevious} aria-label="Lùi một bước">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="play-control" onClick={onTogglePlay}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? "Pause" : snapshot.isComplete ? "Replay" : "Play"}
        </button>
        <button type="button" className="icon-control" onClick={onStepNext} aria-label="Tiến một bước">
          <ChevronRight size={18} />
        </button>
        <button type="button" className="icon-control" onClick={onReset} aria-label="Reset playback">
          <RotateCcw size={17} />
        </button>

        <div className="speed-control" aria-label="Tốc độ playback">
          <Gauge size={16} />
          {speedOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={speed === option ? "active" : ""}
              onClick={() => onSpeedChange(option)}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>

      <div className="playback-progress" aria-label={`Tiến độ ${progressPercent}%`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="playback-details">
        <div>
          <span>Thuật toán</span>
          <strong>{getResultLabel(selectedAlgorithm)}</strong>
        </div>
        <div>
          <span>Bước</span>
          <strong>{stepLabel}</strong>
        </div>
        <div>
          <span>Cạnh hiện tại</span>
          <strong>
            {snapshot.isComplete ? "Đã quay về kho" : `${fromName} → ${toName}`}
          </strong>
        </div>
        <div>
          <span>Cost cạnh</span>
          <strong>{currentSegment ? currentSegment.edgeCost.toFixed(1) : "0.0"}</strong>
        </div>
        <div>
          <span>Cost đã đi</span>
          <strong>{snapshot.currentCost.toFixed(1)}</strong>
        </div>
      </div>
    </div>
  );
}
