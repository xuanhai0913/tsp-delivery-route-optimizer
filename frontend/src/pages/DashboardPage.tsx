import { lazy, Suspense, useMemo, useState } from "react";
import {
  Database,
  GitBranch,
  Info,
  Map,
  Play,
  RefreshCcw,
  Route,
  Table2,
  Waypoints,
  Zap,
} from "lucide-react";
import { AlgorithmStateTable } from "../components/AlgorithmStateTable";
import { ComparisonTable } from "../components/ComparisonTable";
import { GraphVisualization } from "../components/GraphVisualization";
import { LocationList } from "../components/LocationList";
import { PriorityQueuePanel } from "../components/PriorityQueuePanel";
import { ResultCard } from "../components/ResultCard";
import { RoutePlaybackPanel } from "../components/RoutePlaybackPanel";
import { ValidationMessage } from "../components/ValidationMessage";
import { useRoutePlayback } from "../hooks/useRoutePlayback";
import type { AlgorithmKey, Dataset, SolverState, ValidationIssue } from "../types/path";
import { buildComparisonRows } from "../utils/route";
import { hasBlockingIssue } from "../utils/validation";

const RouteMap = lazy(() => import("../components/RouteMap"));

type DashboardPageProps = {
  dataset: Dataset;
  datasets: Dataset[];
  source: number;
  target: number;
  results: SolverState;
  solving: Partial<Record<AlgorithmKey, boolean>>;
  statusMessage: string;
  validationIssues: ValidationIssue[];
  onDatasetChange: (dataset: Dataset) => void;
  onSourceChange: (source: number) => void;
  onTargetChange: (target: number) => void;
  onRunDijkstra: () => void;
  onRunAStar: () => void;
  onRunBoth: () => void;
  onResetResults: () => void;
};

type VisualTab = "map" | "graph";

export function DashboardPage({
  dataset,
  datasets,
  source,
  target,
  results,
  solving,
  statusMessage,
  validationIssues,
  onDatasetChange,
  onSourceChange,
  onTargetChange,
  onRunDijkstra,
  onRunAStar,
  onRunBoth,
  onResetResults,
}: DashboardPageProps) {
  const [visualTab, setVisualTab] = useState<VisualTab>("map");
  const [visibleRoutes, setVisibleRoutes] = useState<Record<AlgorithmKey, boolean>>({
    dijkstra: true,
    aStar: true,
  });

  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);
  const anySolving = Boolean(solving.dijkstra || solving.aStar);
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
            <h2>Dữ liệu graph</h2>
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

          <label className="field-label" htmlFor="source">
            Nguồn
          </label>
          <select id="source" value={source} onChange={(event) => onSourceChange(Number(event.target.value))}>
            {dataset.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id} - {node.name}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="target">
            Đích
          </label>
          <select id="target" value={target} onChange={(event) => onTargetChange(Number(event.target.value))}>
            {dataset.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id} - {node.name}
              </option>
            ))}
          </select>

          <button className="soft-button" type="button" onClick={() => onDatasetChange(dataset)}>
            Nạp graph
          </button>
        </div>

        <div className="panel">
          <div className="section-title-inline">
            <Play size={23} />
            <h2>Điều khiển thuật toán</h2>
          </div>

          <button
            className="run-button greedy"
            type="button"
            disabled={isBlocked || Boolean(solving.dijkstra)}
            onClick={onRunDijkstra}
          >
            <Waypoints size={18} />
            {solving.dijkstra ? "Đang chạy Dijkstra" : "Chạy Dijkstra"}
          </button>
          <button
            className="run-button branch"
            type="button"
            disabled={isBlocked || Boolean(solving.aStar)}
            onClick={onRunAStar}
          >
            <Zap size={18} />
            {solving.aStar ? "Đang chạy A*" : "Chạy A*"}
          </button>

          <div className="or-divider">
            <span />
            HOẶC
            <span />
          </div>

          <button className="run-button compare" type="button" disabled={isBlocked || anySolving} onClick={onRunBoth}>
            <Route size={18} />
            Chạy cả hai
          </button>
          <button className="reset-button" type="button" onClick={onResetResults}>
            <RefreshCcw size={18} />
            Reset / Xóa KQ
          </button>

          <p className="status-message">{statusMessage}</p>
        </div>

        <LocationList nodes={dataset.nodes} source={source} target={target} />
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
                  className={visibleRoutes.dijkstra ? "enabled greedy" : ""}
                  type="button"
                  onClick={() => toggleRoute("dijkstra")}
                >
                  <span />
                  Dijkstra
                </button>
                <button
                  className={visibleRoutes.aStar ? "enabled branch" : ""}
                  type="button"
                  onClick={() => toggleRoute("aStar")}
                >
                  <span />
                  A*
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

            <div className="visual-demo-layout">
              <div className="visual-body">
                {visualTab === "map" ? (
                  <Suspense fallback={<div className="map-skeleton">Đang tải bản đồ...</div>}>
                    <RouteMap
                      dataset={dataset}
                      results={results}
                      visibleRoutes={visibleRoutes}
                      source={source}
                      target={target}
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
                  Replay mô phỏng quá trình thuật toán trên graph demo, không phải dữ liệu Google Maps thật.
                </div>
              </div>

              {playback.snapshot.isTraceMode && playback.snapshot.algorithm ? (
                <aside className="algorithm-inspector">
                  <AlgorithmStateTable
                    algorithm={playback.snapshot.algorithm}
                    snapshot={playback.snapshot}
                  />
                  <PriorityQueuePanel snapshot={playback.snapshot} />
                </aside>
              ) : null}
            </div>
          </div>

          <div className="panel matrix-panel">
            <div className="panel-heading">
              <div className="section-title-inline">
                <Table2 size={23} />
                <h2>Danh sách cạnh có trọng số</h2>
              </div>
            </div>
            <div className="edge-table-wrap">
              <table className="comparison-table" aria-label="Danh sách cạnh graph">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Weight</th>
                    <th>Geometry</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.edges.map((edge) => (
                    <tr key={edge.id}>
                      <td>{edge.id}</td>
                      <td>{edge.from}</td>
                      <td>{edge.to}</td>
                      <td>{edge.weight}</td>
                      <td>{edge.geometry?.length ?? 2} pts</td>
                      <td>{edge.label ?? "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ValidationMessage issues={validationIssues} />

        <div className="results-grid">
          <ResultCard
            algorithm="dijkstra"
            result={results.dijkstra}
            nodes={dataset.nodes}
            isLoading={solving.dijkstra}
            activeStep={playback.snapshot.activeStep}
            activeNodeId={playback.snapshot.currentTraceStep?.currentNode}
            isPlaybackTarget={Boolean(results.dijkstra && playback.selectedAlgorithm === "dijkstra")}
            onSelectPlayback={playback.setSelectedAlgorithm}
          />
          <ResultCard
            algorithm="aStar"
            result={results.aStar}
            nodes={dataset.nodes}
            isLoading={solving.aStar}
            activeStep={playback.snapshot.activeStep}
            activeNodeId={playback.snapshot.currentTraceStep?.currentNode}
            isPlaybackTarget={Boolean(results.aStar && playback.selectedAlgorithm === "aStar")}
            onSelectPlayback={playback.setSelectedAlgorithm}
          />
        </div>

        <section className="panel comparison-panel">
          <div className="section-title-inline">
            <BarChartIcon />
            <h2>Bảng so sánh hiệu suất</h2>
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
