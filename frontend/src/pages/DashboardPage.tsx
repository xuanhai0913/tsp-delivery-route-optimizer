import { lazy, Suspense, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Ban,
  Car,
  CloudRain,
  CloudSun,
  Database,
  GitBranch,
  Layers,
  Map,
  Play,
  RefreshCcw,
  X,
} from "lucide-react";
import { AlgorithmStateTable } from "../components/AlgorithmStateTable";
import { AlgorithmTerminal } from "../components/AlgorithmTerminal";
import { GraphVisualization } from "../components/GraphVisualization";
import { PriorityQueuePanel } from "../components/PriorityQueuePanel";
import { ResultCard } from "../components/ResultCard";
import { RoutePlaybackPanel } from "../components/RoutePlaybackPanel";
import { ValidationMessage } from "../components/ValidationMessage";
import { useRoutePlayback } from "../hooks/useRoutePlayback";
import { ALGORITHMS, getAlgorithmColor, getAlgorithmConfig } from "../data/algorithms";
import type {
  AlgorithmKey,
  Dataset,
  GraphEdge,
  RoadScenario,
  RoadScenarioKey,
  SolverState,
  TerminalLogEntry,
  ValidationIssue,
} from "../types/path";
import { buildComparisonRows } from "../utils/route";
import { hasBlockingIssue } from "../utils/validation";

const RouteMap = lazy(() => import("../components/RouteMap"));

type DashboardPageProps = {
  dataset: Dataset;
  scenarioDataset: Dataset;
  datasets: Dataset[];
  source: number;
  target: number;
  results: SolverState;
  solving: Partial<Record<AlgorithmKey, boolean>>;
  statusMessage: string;
  validationIssues: ValidationIssue[];
  roadScenarios: RoadScenario[];
  selectedScenario: RoadScenario;
  scenarioAffectedEdgeIds: string[];
  scenarioBlockedEdgeIds: string[];
  terminalLogs: TerminalLogEntry[];
  onDatasetChange: (dataset: Dataset) => void;
  onSourceChange: (source: number) => void;
  onTargetChange: (target: number) => void;
  onScenarioChange: (scenario: RoadScenarioKey) => void;
  onRunAlgorithm: (algorithm: AlgorithmKey) => void;
  onRunAll: () => void;
  onResetResults: () => void;
  onClearTerminal: () => void;
};

type VisualTab = "map" | "graph";

function scenarioIcon(key: RoadScenarioKey) {
  switch (key) {
    case "rain":
      return <CloudRain size={16} />;
    case "rushHour":
      return <Car size={16} />;
    case "blockedRoad":
      return <Ban size={16} />;
    case "normal":
    default:
      return <CloudSun size={16} />;
  }
}

function edgeWeightLabel(edge: GraphEdge, scenarioDataset: Dataset): string {
  const adjustedEdge = scenarioDataset.edges.find((item) => item.id === edge.id);
  return adjustedEdge ? adjustedEdge.weight.toString() : "blocked";
}

function nodeName(dataset: Dataset, id: number): string {
  return dataset.nodes.find((node) => node.id === id)?.name ?? `Node ${id}`;
}

export function DashboardPage({
  dataset,
  scenarioDataset,
  datasets,
  source,
  target,
  results,
  solving,
  statusMessage,
  validationIssues,
  roadScenarios,
  selectedScenario,
  scenarioAffectedEdgeIds,
  scenarioBlockedEdgeIds,
  terminalLogs,
  onDatasetChange,
  onSourceChange,
  onTargetChange,
  onScenarioChange,
  onRunAlgorithm,
  onRunAll,
  onResetResults,
  onClearTerminal,
}: DashboardPageProps) {
  const [visualTab, setVisualTab] = useState<VisualTab>("map");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmKey>("dijkstra");
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [visibleRoutes, setVisibleRoutes] = useState<Record<AlgorithmKey, boolean>>({
    dijkstra: true,
    aStar: true,
    floydWarshall: true,
  });

  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);
  const anySolving = ALGORITHMS.some(({ key }) => solving[key]);
  const playback = useRoutePlayback({ dataset: scenarioDataset, results });
  const affectedEdgeSet = useMemo(() => new Set(scenarioAffectedEdgeIds), [scenarioAffectedEdgeIds]);
  const blockedEdgeSet = useMemo(() => new Set(scenarioBlockedEdgeIds), [scenarioBlockedEdgeIds]);

  const scenarioBadges = useMemo(() => {
    if (selectedScenario.key === "normal") {
      return [];
    }
    if (selectedScenario.key === "blockedRoad") {
      return ["Blocked edge avoided"];
    }
    if (selectedScenario.key === "rain") {
      return ["Cost changed"];
    }
    return ["Traffic affected"];
  }, [selectedScenario.key]);

  const activeResult = playback.snapshot.algorithm ? results[playback.snapshot.algorithm] : undefined;
  const activeAlgorithm = playback.snapshot.algorithm;
  const terminalArtMode = anySolving ? "running" : "idle";
  const terminalArtColor = getAlgorithmColor(activeAlgorithm ?? selectedAlgorithm);

  const toggleRoute = (algorithm: AlgorithmKey) => {
    setVisibleRoutes((current) => ({ ...current, [algorithm]: !current[algorithm] }));
  };

  const handleCompareAll = () => {
    onRunAll();
    setIsCompareOpen(true);
  };

  const bestCost = comparisonRows.length > 0 ? Math.min(...comparisonRows.map((row) => row.totalCost)) : undefined;

  return (
    <div className="routelab-dashboard page-enter">
      <div className="routelab-body">
        <aside className="routelab-sidebar">
          <section className="rl-section">
            <h3>Đồ thị</h3>
            <label className="field-label" htmlFor="dataset">
              Bộ dữ liệu
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
              Nút xuất phát
            </label>
            <select id="source" value={source} onChange={(event) => onSourceChange(Number(event.target.value))}>
              {dataset.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.id} - {node.name}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="target">
              Nút đích
            </label>
            <select id="target" value={target} onChange={(event) => onTargetChange(Number(event.target.value))}>
              {dataset.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.id} - {node.name}
                </option>
              ))}
            </select>
          </section>

          <section className="rl-section">
            <h3>Thuật toán</h3>
            <div className="algo-options">
              {ALGORITHMS.map(({ key, label, complexity }) => (
                <label
                  key={key}
                  className={`algo-option ${selectedAlgorithm === key ? "selected" : ""}`}
                  style={{ "--algo-color": getAlgorithmColor(key) } as CSSProperties}
                >
                  <input
                    type="radio"
                    name="algo"
                    value={key}
                    checked={selectedAlgorithm === key}
                    onChange={() => setSelectedAlgorithm(key)}
                  />
                  <span className="radio-dot" />
                  <span className="algo-label">{label}</span>
                  <span className="algo-tag">{complexity}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rl-section">
            <div className="rl-label-row">
              <Layers size={15} />
              <h3>Kịch bản</h3>
            </div>
            <select
              id="scenario"
              value={selectedScenario.key}
              onChange={(event) => onScenarioChange(event.target.value as RoadScenarioKey)}
            >
              {roadScenarios.map((scenario) => (
                <option key={scenario.key} value={scenario.key}>
                  {scenario.label}
                </option>
              ))}
            </select>
            <p className="scenario-note">{selectedScenario.description}</p>
            <div className="rl-btn-group">
              <button
                className="rl-btn primary"
                type="button"
                disabled={isBlocked || Boolean(solving[selectedAlgorithm])}
                onClick={() => onRunAlgorithm(selectedAlgorithm)}
              >
                <Play size={15} />
                {solving[selectedAlgorithm]
                  ? `Đang chạy ${getAlgorithmConfig(selectedAlgorithm).shortLabel}`
                  : "Chạy mô phỏng"}
              </button>
              <button className="rl-btn ghost" type="button" onClick={onResetResults}>
                <RefreshCcw size={15} />
                Đặt lại
              </button>
            </div>
            <p className="status-message">{statusMessage}</p>
          </section>

          <section className="rl-section">
            <h3>So sánh tất cả</h3>
            <button className="rl-btn ghost block" type="button" disabled={isBlocked || anySolving} onClick={handleCompareAll}>
              <GitBranch size={15} />
              Chạy cả {ALGORITHMS.length} thuật toán
            </button>
          </section>

          <section className="rl-section">
            <ValidationMessage issues={validationIssues} />
          </section>

          {comparisonRows.length > 0 ? (
            <section className="rl-section">
              <h3>Kết quả</h3>
              <div className="result-cards">
                {ALGORITHMS.map(({ key }) => {
                  if (!results[key] && !solving[key]) {
                    return null;
                  }
                  return (
                    <ResultCard
                      key={key}
                      algorithm={key}
                      result={results[key]}
                      nodes={scenarioDataset.nodes}
                      isLoading={solving[key]}
                      badges={scenarioBadges}
                      activeStep={playback.snapshot.activeStep}
                      activeNodeId={playback.snapshot.currentTraceStep?.currentNode}
                      isPlaybackTarget={Boolean(results[key] && playback.selectedAlgorithm === key)}
                      onSelectPlayback={playback.setSelectedAlgorithm}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {playback.snapshot.isTraceMode && playback.snapshot.algorithm ? (
            <section className="rl-section">
              <details className="drawer-details" open>
                <summary>
                  <GitBranch size={15} />
                  Trace state
                </summary>
                <AlgorithmStateTable algorithm={playback.snapshot.algorithm} snapshot={playback.snapshot} />
                <PriorityQueuePanel snapshot={playback.snapshot} />
              </details>
            </section>
          ) : null}

          <section className="rl-section">
            <details className="drawer-details">
              <summary>
                <Database size={15} />
                Dữ liệu graph
              </summary>
              <div className="mini-data-grid">
                <div>
                  <h4>Nodes</h4>
                  {dataset.nodes.map((node) => (
                    <p key={node.id} className={node.id === source || node.id === target ? "active" : ""}>
                      <strong>{node.id}</strong>
                      {node.name}
                    </p>
                  ))}
                </div>
                <div>
                  <h4>Edges</h4>
                  {dataset.edges.map((edge) => (
                    <p
                      key={edge.id}
                      className={[
                        affectedEdgeSet.has(edge.id) ? "affected" : "",
                        blockedEdgeSet.has(edge.id) ? "blocked" : "",
                      ].join(" ")}
                    >
                      <strong>{edge.id}</strong>
                      {edgeWeightLabel(edge, scenarioDataset)}
                    </p>
                  ))}
                </div>
              </div>
            </details>
          </section>
        </aside>

        <div className="routelab-map-area">
          <div className="map-hud">
            <div className="tab-group" role="tablist" aria-label="Chế độ trực quan">
              <button type="button" className={visualTab === "map" ? "active" : ""} onClick={() => setVisualTab("map")}>
                <Map size={16} />
                Map
              </button>
              <button type="button" className={visualTab === "graph" ? "active" : ""} onClick={() => setVisualTab("graph")}>
                <GitBranch size={16} />
                Graph
              </button>
            </div>

            <div className="route-toggles">
              {ALGORITHMS.map(({ key, shortLabel }) => (
                <button
                  key={key}
                  className={visibleRoutes[key] ? "enabled" : ""}
                  style={{ "--algo-color": getAlgorithmColor(key) } as CSSProperties}
                  type="button"
                  onClick={() => toggleRoute(key)}
                >
                  <span />
                  {shortLabel}
                </button>
              ))}
            </div>

            <div className={`scenario-pill ${selectedScenario.key}`}>
              {scenarioIcon(selectedScenario.key)}
              {selectedScenario.label}
            </div>
          </div>

          <div className="routelab-map-shell">
            {visualTab === "map" ? (
              <Suspense fallback={<div className="map-skeleton">Đang tải bản đồ...</div>}>
                <RouteMap
                  dataset={scenarioDataset}
                  baseDataset={dataset}
                  results={results}
                  visibleRoutes={visibleRoutes}
                  source={source}
                  target={target}
                  playback={playback.snapshot}
                  roadScenario={selectedScenario}
                  affectedEdgeIds={scenarioAffectedEdgeIds}
                  blockedEdgeIds={scenarioBlockedEdgeIds}
                />
                {selectedScenario.key === "rain" ? <div className="weather-rain-overlay" aria-hidden="true" /> : null}
              </Suspense>
            ) : (
              <GraphVisualization
                dataset={scenarioDataset}
                results={results}
                visibleRoutes={visibleRoutes}
                playback={playback.snapshot}
              />
            )}

            <div className="map-legend-overlay" aria-hidden="true">
              <h4>Chú thích</h4>
              {ALGORITHMS.map(({ key, label }) => (
                <div className="legend-item" key={key}>
                  <span className="legend-line" style={{ background: getAlgorithmColor(key) }} />
                  {label}
                </div>
              ))}
            </div>

            {activeResult && activeAlgorithm ? (
              <div className="map-results-bar">
                <div className="result-item">
                  <span className="label">Thuật toán</span>
                  <span className="value">{getAlgorithmConfig(activeAlgorithm).label}</span>
                </div>
                <span className="bar-divider" />
                <div className="result-item">
                  <span className="label">Chi phí</span>
                  <span className="value">{activeResult.totalCost}</span>
                </div>
                <span className="bar-divider" />
                <div className="result-item">
                  <span className="label">Thời gian</span>
                  <span className="value">{activeResult.runtimeMs} ms</span>
                </div>
                <span className="bar-divider" />
                <div className="result-item">
                  <span className="label">Đã duyệt</span>
                  <span className="value">{activeResult.visitedOrder?.length ?? activeResult.path.length}</span>
                </div>
                <span className="bar-divider" />
                <div className="result-item grow">
                  <span className="label">Đường đi</span>
                  <span className="value path-nodes">
                    {activeResult.path.map((id) => nodeName(scenarioDataset, id)).join(" → ")}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <RoutePlaybackPanel
            dataset={scenarioDataset}
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

          <AlgorithmTerminal
            logs={terminalLogs}
            onClear={onClearTerminal}
            artMode={terminalArtMode}
            artColor={terminalArtColor}
          />
        </div>
      </div>

      {isCompareOpen ? (
        <>
          <div className="rl-modal-overlay" onClick={() => setIsCompareOpen(false)} />
          <div className="rl-compare-panel" role="dialog" aria-label="So sánh thuật toán">
            <div className="cp-header">
              <h2>So sánh thuật toán</h2>
              <button type="button" className="cp-close" onClick={() => setIsCompareOpen(false)} aria-label="Đóng">
                <X size={18} />
              </button>
            </div>
            <div className="cp-body">
              {comparisonRows.length === 0 ? (
                <p className="cp-empty">Chưa có kết quả. Chạy cả {ALGORITHMS.length} thuật toán để so sánh.</p>
              ) : (
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>Thuật toán</th>
                      <th>Chi phí</th>
                      <th>Thời gian</th>
                      <th>Đã duyệt</th>
                      <th>Đường đi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.algorithm}>
                        <td>
                          <span className="algo-name">
                            <span className="algo-dot" style={{ background: getAlgorithmColor(row.algorithm) }} />
                            {row.name}
                          </span>
                        </td>
                        <td className={row.totalCost === bestCost ? "best" : ""}>{row.totalCost}</td>
                        <td className={row.isFastest ? "best" : ""}>{row.runtimeMs} ms</td>
                        <td>{row.visitedCount}</td>
                        <td className="cp-path">{row.path.join(" → ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
