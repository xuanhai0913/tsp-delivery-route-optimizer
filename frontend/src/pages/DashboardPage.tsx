import { lazy, Suspense, useMemo, useState } from "react";
import {
  Ban,
  Car,
  ChevronLeft,
  CloudRain,
  CloudSun,
  Database,
  GitBranch,
  Layers,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RefreshCcw,
  Route,
  Waypoints,
  Zap,
} from "lucide-react";
import { AlgorithmStateTable } from "../components/AlgorithmStateTable";
import { AlgorithmTerminal } from "../components/AlgorithmTerminal";
import { GraphVisualization } from "../components/GraphVisualization";
import { PriorityQueuePanel } from "../components/PriorityQueuePanel";
import { ResultCard } from "../components/ResultCard";
import { RoutePlaybackPanel } from "../components/RoutePlaybackPanel";
import { ValidationMessage } from "../components/ValidationMessage";
import { useRoutePlayback } from "../hooks/useRoutePlayback";
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
  onRunDijkstra: () => void;
  onRunAStar: () => void;
  onRunBoth: () => void;
  onResetResults: () => void;
  onClearTerminal: () => void;
};

type VisualTab = "map" | "graph";

function scenarioIcon(key: RoadScenarioKey) {
  switch (key) {
    case "rain":
      return <CloudRain size={17} />;
    case "rushHour":
      return <Car size={17} />;
    case "blockedRoad":
      return <Ban size={17} />;
    case "normal":
    default:
      return <CloudSun size={17} />;
  }
}

function edgeWeightLabel(edge: GraphEdge, scenarioDataset: Dataset): string {
  const adjustedEdge = scenarioDataset.edges.find((item) => item.id === edge.id);
  return adjustedEdge ? adjustedEdge.weight.toString() : "blocked";
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
  onRunDijkstra,
  onRunAStar,
  onRunBoth,
  onResetResults,
  onClearTerminal,
}: DashboardPageProps) {
  const [visualTab, setVisualTab] = useState<VisualTab>("map");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [visibleRoutes, setVisibleRoutes] = useState<Record<AlgorithmKey, boolean>>({
    dijkstra: true,
    aStar: true,
  });

  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);
  const anySolving = Boolean(solving.dijkstra || solving.aStar);
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

  const toggleRoute = (algorithm: AlgorithmKey) => {
    setVisibleRoutes((current) => ({ ...current, [algorithm]: !current[algorithm] }));
  };

  return (
    <div className="maps-dashboard page-enter">
      <section className="map-demo-stage">
        <button
          className="drawer-fab"
          type="button"
          onClick={() => setIsDrawerOpen((current) => !current)}
          aria-label={isDrawerOpen ? "Ẩn bảng điều khiển" : "Mở bảng điều khiển"}
        >
          {isDrawerOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <aside className={`map-control-drawer ${isDrawerOpen ? "open" : "closed"}`}>
          {isDrawerOpen ? (
            <>
              <div className="drawer-head">
                <div>
                  <span>Route setup</span>
                  <h2>Điều khiển mô phỏng</h2>
                </div>
                <button type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Ẩn bảng điều khiển">
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div className="drawer-section">
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
              </div>

              <div className="drawer-section">
                <div className="drawer-label-row">
                  <Layers size={16} />
                  <span>Điều kiện đường đi</span>
                </div>
                <div className="scenario-grid">
                  {roadScenarios.map((scenario) => (
                    <button
                      key={scenario.key}
                      type="button"
                      className={selectedScenario.key === scenario.key ? "active" : ""}
                      onClick={() => onScenarioChange(scenario.key)}
                    >
                      {scenarioIcon(scenario.key)}
                      <span>{scenario.label}</span>
                    </button>
                  ))}
                </div>
                <p className="scenario-note">{selectedScenario.description}</p>
              </div>

              <div className="drawer-section run-stack">
                <div className="drawer-label-row">
                  <Play size={16} />
                  <span>Chạy thuật toán</span>
                </div>
                <button
                  className="run-button greedy"
                  type="button"
                  disabled={isBlocked || Boolean(solving.dijkstra)}
                  onClick={onRunDijkstra}
                >
                  <Waypoints size={18} />
                  {solving.dijkstra ? "Đang chạy Dijkstra" : "Dijkstra"}
                </button>
                <button
                  className="run-button branch"
                  type="button"
                  disabled={isBlocked || Boolean(solving.aStar)}
                  onClick={onRunAStar}
                >
                  <Zap size={18} />
                  {solving.aStar ? "Đang chạy A*" : "A*"}
                </button>
                <button className="run-button compare" type="button" disabled={isBlocked || anySolving} onClick={onRunBoth}>
                  <Route size={18} />
                  Chạy cả hai
                </button>
                <button className="reset-button" type="button" onClick={onResetResults}>
                  <RefreshCcw size={18} />
                  Reset
                </button>
                <p className="status-message">{statusMessage}</p>
              </div>

              <ValidationMessage issues={validationIssues} />

              <details className="drawer-details">
                <summary>
                  <Database size={16} />
                  Dữ liệu graph
                </summary>
                <div className="mini-data-grid">
                  <div>
                    <h3>Nodes</h3>
                    {dataset.nodes.map((node) => (
                      <p key={node.id} className={node.id === source || node.id === target ? "active" : ""}>
                        <strong>{node.id}</strong>
                        {node.name}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3>Edges</h3>
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

              {playback.snapshot.isTraceMode && playback.snapshot.algorithm ? (
                <details className="drawer-details">
                  <summary>
                    <GitBranch size={16} />
                    Trace state
                  </summary>
                  <AlgorithmStateTable algorithm={playback.snapshot.algorithm} snapshot={playback.snapshot} />
                  <PriorityQueuePanel snapshot={playback.snapshot} />
                </details>
              ) : null}
            </>
          ) : null}
        </aside>

        <div className="map-hud">
          <div className="tab-group" role="tablist" aria-label="Chế độ trực quan">
            <button type="button" className={visualTab === "map" ? "active" : ""} onClick={() => setVisualTab("map")}>
              <Map size={18} />
              Map
            </button>
            <button type="button" className={visualTab === "graph" ? "active" : ""} onClick={() => setVisualTab("graph")}>
              <GitBranch size={18} />
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

          <div className={`scenario-pill ${selectedScenario.key}`}>
            {scenarioIcon(selectedScenario.key)}
            {selectedScenario.label}
          </div>
        </div>

        <div className="map-visual-shell">
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
        </div>

        <div className="map-results-sheet">
          <div className="result-tray">
            <ResultCard
              algorithm="dijkstra"
              result={results.dijkstra}
              nodes={scenarioDataset.nodes}
              isLoading={solving.dijkstra}
              badges={scenarioBadges}
              activeStep={playback.snapshot.activeStep}
              activeNodeId={playback.snapshot.currentTraceStep?.currentNode}
              isPlaybackTarget={Boolean(results.dijkstra && playback.selectedAlgorithm === "dijkstra")}
              onSelectPlayback={playback.setSelectedAlgorithm}
            />
            <ResultCard
              algorithm="aStar"
              result={results.aStar}
              nodes={scenarioDataset.nodes}
              isLoading={solving.aStar}
              badges={scenarioBadges}
              activeStep={playback.snapshot.activeStep}
              activeNodeId={playback.snapshot.currentTraceStep?.currentNode}
              isPlaybackTarget={Boolean(results.aStar && playback.selectedAlgorithm === "aStar")}
              onSelectPlayback={playback.setSelectedAlgorithm}
            />
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

          <div className="compare-strip" aria-label="So sánh nhanh">
            {comparisonRows.length === 0 ? (
              <span>Chưa có kết quả. Chọn scenario rồi chạy thuật toán.</span>
            ) : (
              comparisonRows.map((row) => (
                <div key={row.algorithm}>
                  <strong>{row.name}</strong>
                  <span>{row.path.join(" → ")}</span>
                  <em>cost {row.totalCost}</em>
                  <small>{row.visitedCount} visited</small>
                </div>
              ))
            )}
          </div>
        </div>

        <AlgorithmTerminal logs={terminalLogs} onClear={onClearTerminal} />
      </section>
    </div>
  );
}
