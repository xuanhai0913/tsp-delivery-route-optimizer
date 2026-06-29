import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { GuidePage } from "./pages/GuidePage";
import { ReportPage } from "./pages/ReportPage";
import { mockDatasets } from "./data/mockDatasets";
import { ALGORITHM_KEYS, getAlgorithmConfig } from "./data/algorithms";
import { defaultRoadScenario, roadScenarios } from "./data/roadScenarios";
import { datasetClient } from "./services/datasetClient";
import { solverClient } from "./services/solverClient";
import type { AlgorithmKey, Dataset, RoadScenarioKey, SolveRequest, SolveResult, SolverState, TerminalLogEntry, TerminalLogTone } from "./types/path";
import { downloadJson, exportElementToPng } from "./utils/export";
import { applyRoadScenario, getScenarioAffectedEdgeIds } from "./utils/roadScenarios";
import { hasBlockingIssue, validateDataset } from "./utils/validation";

export type ViewKey = "dashboard" | "data" | "report" | "guide";

const initialDataset = mockDatasets[0];

function createTerminalLog(tone: TerminalLogTone, message: string): TerminalLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tone,
    message,
    timestamp: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function solveWith(algorithm: AlgorithmKey, request: SolveRequest): Promise<SolveResult> {
  switch (algorithm) {
    case "dijkstra":
      return solverClient.solveDijkstra(request);
    case "aStar":
      return solverClient.solveAStar(request);
    case "floydWarshall":
      return solverClient.solveFloydWarshall(request);
    default:
      return solverClient.solveDijkstra(request);
  }
}

function formatPath(path: number[]): string {
  return path.length > 0 ? path.join(" → ") : "không tìm thấy";
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [isNavigating, startNavigationTransition] = useTransition();
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [dataset, setDataset] = useState<Dataset>(initialDataset);
  const [source, setSource] = useState(initialDataset.defaultSource);
  const [target, setTarget] = useState(initialDataset.defaultTarget);
  const [results, setResults] = useState<SolverState>({});
  const [solving, setSolving] = useState<Partial<Record<AlgorithmKey, boolean>>>({});
  const [statusMessage, setStatusMessage] = useState("Graph mẫu đã sẵn sàng.");
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<RoadScenarioKey>(defaultRoadScenario.key);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([
    createTerminalLog("info", "RouteLab console ready."),
  ]);
  const exportRef = useRef<HTMLDivElement>(null);

  const appendTerminalLog = useCallback((tone: TerminalLogTone, message: string) => {
    setTerminalLogs((current) => [...current, createTerminalLog(tone, message)].slice(-60));
  }, []);

  const selectedScenario = useMemo(
    () => roadScenarios.find((scenario) => scenario.key === selectedScenarioKey) ?? defaultRoadScenario,
    [selectedScenarioKey]
  );
  const scenarioDataset = useMemo(
    () => applyRoadScenario(dataset, selectedScenario),
    [dataset, selectedScenario]
  );
  const scenarioAffectedEdgeIds = useMemo(
    () => getScenarioAffectedEdgeIds(dataset, selectedScenario),
    [dataset, selectedScenario]
  );
  const scenarioBlockedEdgeIds = selectedScenario.blockedEdgeIds ?? [];

  useEffect(() => {
    let isCancelled = false;

    setStatusMessage("Đang tải graph từ backend...");

    datasetClient
      .loadDatasets()
      .then((result) => {
        if (isCancelled) {
          return;
        }

        const nextDataset =
          result.datasets.find((item) => item.id === "hcm-7") ??
          result.datasets[0] ??
          initialDataset;

        setDatasets(result.datasets.length > 0 ? result.datasets : mockDatasets);
        setDataset(nextDataset);
        setSource(nextDataset.defaultSource);
        setTarget(nextDataset.defaultTarget);
        setResults({});
        setSelectedScenarioKey(defaultRoadScenario.key);
        setStatusMessage(
          result.source === "backend"
            ? "Đã tải graph từ backend."
            : "Backend tạm thời chậm, đang dùng dữ liệu mock local."
        );
        appendTerminalLog(
          result.source === "backend" ? "success" : "warning",
          result.source === "backend"
            ? "✓ Loaded hcm-7 graph from backend."
            : "⚠ Backend slow, using local mock graph."
        );
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setDatasets(mockDatasets);
        setDataset(initialDataset);
        setSource(initialDataset.defaultSource);
        setTarget(initialDataset.defaultTarget);
        setResults({});
        setSelectedScenarioKey(defaultRoadScenario.key);
        setStatusMessage(error instanceof Error ? error.message : "Không thể tải graph từ backend.");
        appendTerminalLog("error", error instanceof Error ? error.message : "Không thể tải graph từ backend.");
      });

    return () => {
      isCancelled = true;
    };
  }, [appendTerminalLog]);

  const validationIssues = useMemo(
    () => validateDataset(scenarioDataset, source, target),
    [scenarioDataset, source, target]
  );
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);

  const switchView = (view: ViewKey) => {
    startNavigationTransition(() => {
      setActiveView(view);
    });
  };

  const applyDataset = (nextDataset: Dataset) => {
    setDatasets((current) => {
      const hasDataset = current.some((item) => item.id === nextDataset.id);
      return hasDataset
        ? current.map((item) => (item.id === nextDataset.id ? nextDataset : item))
        : [nextDataset, ...current];
    });
    setDataset(nextDataset);
    setSource(nextDataset.defaultSource);
    setTarget(nextDataset.defaultTarget);
    setSelectedScenarioKey(defaultRoadScenario.key);
    setResults({});
    setStatusMessage("Đã áp dụng graph mới. Có thể chạy Dijkstra, A* hoặc Floyd-Warshall.");
    appendTerminalLog("info", `Dataset selected: ${nextDataset.name}`);
    switchView("dashboard");
  };

  const buildRequest = () => ({
    source,
    target,
    nodes: scenarioDataset.nodes,
    edges: scenarioDataset.edges,
    directed: scenarioDataset.directed,
  });

  const changeScenario = (scenarioKey: RoadScenarioKey) => {
    const scenario = roadScenarios.find((item) => item.key === scenarioKey) ?? defaultRoadScenario;
    setSelectedScenarioKey(scenario.key);
    setResults({});
    setStatusMessage(`Đã chọn mô phỏng: ${scenario.label}. Chạy lại thuật toán để xem path mới.`);
    appendTerminalLog("command", `> scenario: ${scenario.label}`);
  };

  const changeSource = (nextSource: number) => {
    setSource(nextSource);
    setResults({});
    appendTerminalLog("info", `Source changed: ${nextSource}`);
  };

  const changeTarget = (nextTarget: number) => {
    setTarget(nextTarget);
    setResults({});
    appendTerminalLog("info", `Target changed: ${nextTarget}`);
  };

  const runAlgorithm = async (algorithm: AlgorithmKey) => {
    if (isBlocked) {
      setStatusMessage("Vui lòng sửa lỗi graph trước khi chạy thuật toán.");
      return;
    }

    const request = buildRequest();
    const config = getAlgorithmConfig(algorithm);
    setSolving((current) => ({ ...current, [algorithm]: true }));
    setStatusMessage(`Đang gọi backend ${config.label}...`);
    appendTerminalLog("command", `> POST ${config.endpoint}`);

    try {
      const result = await solveWith(algorithm, request);
      setResults((current) => ({ ...current, [algorithm]: result }));
      appendTerminalLog("success", `✓ ${config.label} trace: ${result.traceSteps?.length ?? 0} steps`);
      appendTerminalLog("success", `✓ path: ${formatPath(result.path)}, cost ${result.totalCost}`);
      if (result.resultSource === "mock") {
        appendTerminalLog("warning", "⚠ fallback local mock");
      }
      setStatusMessage(
        result.resultSource === "mock"
          ? `${config.label} dùng fallback mock local.`
          : `Đã nhận kết quả ${config.label} từ backend.`
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
      appendTerminalLog("error", error instanceof Error ? error.message : "Không thể chạy thuật toán.");
    } finally {
      setSolving((current) => ({ ...current, [algorithm]: false }));
    }
  };

  const runBoth = async () => {
    if (isBlocked) {
      setStatusMessage("Vui lòng sửa lỗi graph trước khi chạy thuật toán.");
      return;
    }

    const request = buildRequest();
    setSolving(ALGORITHM_KEYS.reduce((accumulator, key) => ({ ...accumulator, [key]: true }), {}));
    setStatusMessage("Đang gọi backend cho cả 3 thuật toán để so sánh...");
    for (const key of ALGORITHM_KEYS) {
      appendTerminalLog("command", `> POST ${getAlgorithmConfig(key).endpoint}`);
    }

    try {
      const settled = await Promise.all(
        ALGORITHM_KEYS.map((key) =>
          solveWith(key, request)
            .then((result) => ({ key, result }))
            .catch((error: unknown) => ({ key, error }))
        )
      );

      const nextResults: SolverState = {};
      let usedMock = false;
      let failureMessage: string | undefined;

      for (const outcome of settled) {
        const config = getAlgorithmConfig(outcome.key);
        if ("result" in outcome) {
          nextResults[outcome.key] = outcome.result;
          appendTerminalLog("success", `✓ ${config.label} trace: ${outcome.result.traceSteps?.length ?? 0} steps`);
          appendTerminalLog("success", `✓ path: ${formatPath(outcome.result.path)}, cost ${outcome.result.totalCost}`);
          if (outcome.result.resultSource === "mock") {
            usedMock = true;
          }
        } else {
          failureMessage = outcome.error instanceof Error ? outcome.error.message : "Không thể chạy thuật toán.";
          appendTerminalLog("error", `✗ ${config.label}: ${failureMessage}`);
        }
      }

      setResults(nextResults);
      if (usedMock) {
        appendTerminalLog("warning", "⚠ fallback local mock");
      }
      setStatusMessage(
        failureMessage
          ? `Một vài thuật toán lỗi: ${failureMessage}`
          : usedMock
            ? "Backend tạm thời chậm, đã dùng fallback mock local để so sánh."
            : "Đã nhận kết quả so sánh shortest path từ backend."
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
      appendTerminalLog("error", error instanceof Error ? error.message : "Không thể chạy thuật toán.");
    } finally {
      setSolving({});
    }
  };

  const resetResults = () => {
    setResults({});
    setSolving({});
    setStatusMessage("Đã xóa kết quả. Graph vẫn được giữ nguyên.");
    appendTerminalLog("info", "Results cleared.");
  };

  const exportJson = () => {
    downloadJson(scenarioDataset, source, target, results);
    setStatusMessage("Đã xuất JSON kết quả.");
    appendTerminalLog("success", "✓ Exported JSON result.");
  };

  const exportPng = async () => {
    if (!exportRef.current) {
      return;
    }

    setStatusMessage("Đang xuất ảnh PNG...");
    await exportElementToPng(exportRef.current, `shortest-path-${dataset.id}-snapshot.png`);
    setStatusMessage("Đã xuất ảnh PNG.");
    appendTerminalLog("success", "✓ Exported PNG snapshot.");
  };

  const page = (() => {
    switch (activeView) {
      case "data":
        return <DataPage dataset={dataset} onApplyDataset={applyDataset} />;
      case "report":
        return (
          <ReportPage
            dataset={scenarioDataset}
            source={source}
            target={target}
            results={results}
            onExportJson={exportJson}
            onExportPng={exportPng}
          />
        );
      case "guide":
        return <GuidePage />;
      case "dashboard":
      default:
        return (
          <DashboardPage
            dataset={dataset}
            scenarioDataset={scenarioDataset}
            datasets={datasets}
            source={source}
            target={target}
            results={results}
            solving={solving}
            statusMessage={statusMessage}
            validationIssues={validationIssues}
            roadScenarios={roadScenarios}
            selectedScenario={selectedScenario}
            scenarioAffectedEdgeIds={scenarioAffectedEdgeIds}
            scenarioBlockedEdgeIds={scenarioBlockedEdgeIds}
            terminalLogs={terminalLogs}
            onDatasetChange={applyDataset}
            onSourceChange={changeSource}
            onTargetChange={changeTarget}
            onScenarioChange={changeScenario}
            onRunAlgorithm={runAlgorithm}
            onRunAll={runBoth}
            onResetResults={resetResults}
            onClearTerminal={() => setTerminalLogs([])}
          />
        );
    }
  })();

  return (
    <AppShell
      activeView={activeView}
      isNavigating={isNavigating}
      onNavigate={switchView}
      onReset={resetResults}
      onExportJson={exportJson}
      onExportPng={exportPng}
    >
      <div ref={exportRef} id="export-root" className="page-capture">
        {page}
      </div>
    </AppShell>
  );
}
