import { lazy, Suspense, useMemo, useState } from "react";
import {
  Database,
  Expand,
  GitBranch,
  Info,
  Map,
  Play,
  RefreshCcw,
  Route,
  Table2,
  Zap,
} from "lucide-react";
import { ComparisonTable } from "../components/ComparisonTable";
import { CostMatrixTable } from "../components/CostMatrixTable";
import { GraphVisualization } from "../components/GraphVisualization";
import { LocationList } from "../components/LocationList";
import { ResultCard } from "../components/ResultCard";
import { RoutePlaybackPanel } from "../components/RoutePlaybackPanel";
import { ValidationMessage } from "../components/ValidationMessage";
import { useRoutePlayback } from "../hooks/useRoutePlayback";
import type { AlgorithmKey, Dataset, SolverState, ValidationIssue } from "../types/tsp";
import { buildComparisonRows } from "../utils/route";
import { hasBlockingIssue } from "../utils/validation";

const RouteMap = lazy(() => import("../components/RouteMap"));

type DashboardPageProps = {
  dataset: Dataset;
  datasets: Dataset[];
  start: number;
  results: SolverState;
  solving: Partial<Record<AlgorithmKey, boolean>>;
  statusMessage: string;
  validationIssues: ValidationIssue[];
  onDatasetChange: (dataset: Dataset) => void;
  onStartChange: (start: number) => void;
  onRunGreedy: () => void;
  onRunBranchAndBound: () => void;
  onRunBoth: () => void;
  onResetResults: () => void;
};

type VisualTab = "map" | "graph";

export function DashboardPage({
  dataset,
  datasets,
  start,
  results,
  solving,
  statusMessage,
  validationIssues,
  onDatasetChange,
  onStartChange,
  onRunGreedy,
  onRunBranchAndBound,
  onRunBoth,
  onResetResults,
}: DashboardPageProps) {
  const [visualTab, setVisualTab] = useState<VisualTab>("map");
  const [visibleRoutes, setVisibleRoutes] = useState<Record<AlgorithmKey, boolean>>({
    greedy: true,
    branchAndBound: true,
  });

  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);
  const anySolving = Boolean(solving.greedy || solving.branchAndBound);
  const playback = useRoutePlayback({ dataset, results });

  const toggleRoute = (algorithm: AlgorithmKey) => {
    setVisibleRoutes((current) => ({ ...current, [algorithm]: !current[algorithm] }));
  };

  return (
    <div className="dashboard-grid page-enter">
      <section className="control-column">
        <div className="panel">
          <div className="section-title-inline">
            <Database size={23} />
            <h2>Dữ liệu đầu vào</h2>
          </div>

          <label className="field-label" htmlFor="dataset">
            Bộ dữ liệu mẫu
          </label>
          <select
            id="dataset"
            value={dataset.id}
            onChange={(event) => {
              const nextDataset = datasets.find((item) => item.id === event.target.value);
              if (nextDataset) {
                onDatasetChange(nextDataset);
              }
            }}
          >
            {datasets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="start">
            Điểm xuất phát
          </label>
          <select id="start" value={start} onChange={(event) => onStartChange(Number(event.target.value))}>
            {dataset.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.id} - {location.name}
              </option>
            ))}
          </select>

          <button className="soft-button" type="button" onClick={() => onDatasetChange(dataset)}>
            Nạp dữ liệu
          </button>
        </div>

        <div className="panel">
          <div className="section-title-inline">
            <Play size={23} />
            <h2>Điều khiển Thuật toán</h2>
          </div>

          <button
            className="run-button greedy"
            type="button"
            disabled={isBlocked || Boolean(solving.greedy)}
            onClick={onRunGreedy}
          >
            <Zap size={18} />
            {solving.greedy ? "Đang chạy Greedy" : "Chạy Greedy"}
          </button>
          <button
            className="run-button branch"
            type="button"
            disabled={isBlocked || Boolean(solving.branchAndBound)}
            onClick={onRunBranchAndBound}
          >
            <GitBranch size={18} />
            {solving.branchAndBound ? "Đang chạy B&B" : "Chạy Branch and Bound"}
          </button>

          <div className="or-divider">
            <span />
            HOẶC
            <span />
          </div>

          <button className="run-button compare" type="button" disabled={isBlocked || anySolving} onClick={onRunBoth}>
            <Route size={18} />
            Chạy cả hai (So sánh)
          </button>
          <button className="reset-button" type="button" onClick={onResetResults}>
            <RefreshCcw size={18} />
            Reset / Xóa KQ
          </button>

          <p className="status-message">{statusMessage}</p>
        </div>

        <LocationList locations={dataset.locations} start={start} />
      </section>

      <section className="main-dashboard">
        <div className="visual-matrix-grid">
          <div className="panel visual-panel">
            <div className="visual-head">
              <div className="tab-group" role="tablist" aria-label="Chế độ trực quan">
                <button
                  type="button"
                  className={visualTab === "map" ? "active" : ""}
                  onClick={() => setVisualTab("map")}
                >
                  <Map size={19} />
                  Bản đồ
                </button>
                <button
                  type="button"
                  className={visualTab === "graph" ? "active" : ""}
                  onClick={() => setVisualTab("graph")}
                >
                  <GitBranch size={19} />
                  Graph
                </button>
              </div>

              <div className="route-toggles">
                <button
                  className={visibleRoutes.greedy ? "enabled greedy" : ""}
                  type="button"
                  onClick={() => toggleRoute("greedy")}
                >
                  <span />
                  Greedy
                </button>
                <button
                  className={visibleRoutes.branchAndBound ? "enabled branch" : ""}
                  type="button"
                  onClick={() => toggleRoute("branchAndBound")}
                >
                  <span />
                  Branch & Bound
                </button>
              </div>
            </div>

            <RoutePlaybackPanel
              dataset={dataset}
              availableAlgorithms={playback.availableAlgorithms}
              selectedAlgorithm={playback.selectedAlgorithm}
              onAlgorithmChange={playback.setSelectedAlgorithm}
              isPlaying={playback.isPlaying}
              speed={playback.speed}
              speedOptions={playback.speedOptions}
              onSpeedChange={playback.setSpeed}
              snapshot={playback.snapshot}
              onTogglePlay={playback.togglePlay}
              onReset={playback.reset}
              onStepNext={playback.stepNext}
              onStepPrevious={playback.stepPrevious}
            />

            <div className="visual-body">
              {visualTab === "map" ? (
                <Suspense fallback={<div className="map-skeleton">Đang tải bản đồ...</div>}>
                  <RouteMap
                    dataset={dataset}
                    results={results}
                    visibleRoutes={visibleRoutes}
                    start={start}
                    playback={playback.snapshot}
                  />
                </Suspense>
              ) : (
                <GraphVisualization
                  dataset={dataset}
                  results={results}
                  visibleRoutes={visibleRoutes}
                  playback={playback.snapshot}
                />
              )}
              <div className="map-note">
                <Info size={16} />
                Dữ liệu mẫu, tuyến đường vẽ theo tọa độ demo.
              </div>
            </div>
          </div>

          <div className="panel matrix-panel">
            <div className="panel-heading">
              <div className="section-title-inline">
                <Table2 size={23} />
                <h2>Ma trận khoảng cách (km)</h2>
              </div>
              <Expand size={20} />
            </div>
            <CostMatrixTable matrix={dataset.costMatrix} start={start} />
          </div>
        </div>

        <ValidationMessage issues={validationIssues} />

        <div className="results-grid">
          <ResultCard
            algorithm="greedy"
            result={results.greedy}
            locations={dataset.locations}
            isLoading={solving.greedy}
            activeStep={playback.snapshot.activeStep}
            isPlaybackTarget={Boolean(results.greedy && playback.selectedAlgorithm === "greedy")}
            onSelectPlayback={playback.setSelectedAlgorithm}
          />
          <ResultCard
            algorithm="branchAndBound"
            result={results.branchAndBound}
            locations={dataset.locations}
            isLoading={solving.branchAndBound}
            activeStep={playback.snapshot.activeStep}
            isPlaybackTarget={Boolean(results.branchAndBound && playback.selectedAlgorithm === "branchAndBound")}
            onSelectPlayback={playback.setSelectedAlgorithm}
          />
        </div>

        <section className="panel comparison-panel">
          <div className="section-title-inline">
            <BarChartIcon />
            <h2>Bảng So Sánh Hiệu Suất</h2>
          </div>
          <ComparisonTable rows={comparisonRows} />
        </section>
      </section>
    </div>
  );
}

function BarChartIcon() {
  return (
    <span className="mini-icon" aria-hidden="true">
      ▥
    </span>
  );
}
