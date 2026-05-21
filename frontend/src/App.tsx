import { useMemo, useRef, useState, useTransition } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { GuidePage } from "./pages/GuidePage";
import { ReportPage } from "./pages/ReportPage";
import { mockDatasets } from "./data/mockDatasets";
import { solverClient } from "./services/solverClient";
import type { AlgorithmKey, Dataset, SolverState } from "./types/path";
import { downloadJson, exportElementToPng } from "./utils/export";
import { hasBlockingIssue, validateDataset } from "./utils/validation";

export type ViewKey = "dashboard" | "data" | "report" | "guide";

const initialDataset = mockDatasets[0];

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [isNavigating, startNavigationTransition] = useTransition();
  const [dataset, setDataset] = useState<Dataset>(initialDataset);
  const [source, setSource] = useState(initialDataset.defaultSource);
  const [target, setTarget] = useState(initialDataset.defaultTarget);
  const [results, setResults] = useState<SolverState>({});
  const [solving, setSolving] = useState<Partial<Record<AlgorithmKey, boolean>>>({});
  const [statusMessage, setStatusMessage] = useState("Graph mẫu đã sẵn sàng.");
  const exportRef = useRef<HTMLDivElement>(null);

  const validationIssues = useMemo(
    () => validateDataset(dataset, source, target),
    [dataset, source, target]
  );
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);

  const switchView = (view: ViewKey) => {
    startNavigationTransition(() => {
      setActiveView(view);
    });
  };

  const applyDataset = (nextDataset: Dataset) => {
    setDataset(nextDataset);
    setSource(nextDataset.defaultSource);
    setTarget(nextDataset.defaultTarget);
    setResults({});
    setStatusMessage("Đã áp dụng graph mới. Có thể chạy Dijkstra hoặc A*.");
    switchView("dashboard");
  };

  const buildRequest = () => ({
    source,
    target,
    nodes: dataset.nodes,
    edges: dataset.edges,
    directed: dataset.directed,
  });

  const runAlgorithm = async (algorithm: AlgorithmKey) => {
    if (isBlocked) {
      setStatusMessage("Vui lòng sửa lỗi graph trước khi chạy thuật toán.");
      return;
    }

    const request = buildRequest();
    setSolving((current) => ({ ...current, [algorithm]: true }));
    setStatusMessage(algorithm === "dijkstra" ? "Đang mô phỏng Dijkstra..." : "Đang mô phỏng A*...");

    try {
      const result =
        algorithm === "dijkstra"
          ? await solverClient.solveDijkstra(request)
          : await solverClient.solveAStar(request);
      setResults((current) => ({ ...current, [algorithm]: result }));
      setStatusMessage(`${algorithm === "dijkstra" ? "Dijkstra" : "A*"} đã hoàn thành.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
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
    setSolving({ dijkstra: true, aStar: true });
    setStatusMessage("Đang chạy mock Dijkstra và A* để so sánh...");

    try {
      const [dijkstra, aStar] = await Promise.all([
        solverClient.solveDijkstra(request),
        solverClient.solveAStar(request),
      ]);
      setResults({ dijkstra, aStar });
      setStatusMessage("Đã có kết quả so sánh shortest path.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
    } finally {
      setSolving({ dijkstra: false, aStar: false });
    }
  };

  const resetResults = () => {
    setResults({});
    setSolving({});
    setStatusMessage("Đã xóa kết quả. Graph vẫn được giữ nguyên.");
  };

  const exportJson = () => {
    downloadJson(dataset, source, target, results);
    setStatusMessage("Đã xuất JSON kết quả.");
  };

  const exportPng = async () => {
    if (!exportRef.current) {
      return;
    }

    setStatusMessage("Đang xuất ảnh PNG...");
    await exportElementToPng(exportRef.current, `shortest-path-${dataset.id}-snapshot.png`);
    setStatusMessage("Đã xuất ảnh PNG.");
  };

  const page = (() => {
    switch (activeView) {
      case "data":
        return <DataPage dataset={dataset} onApplyDataset={applyDataset} />;
      case "report":
        return (
          <ReportPage
            dataset={dataset}
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
            datasets={mockDatasets}
            source={source}
            target={target}
            results={results}
            solving={solving}
            statusMessage={statusMessage}
            validationIssues={validationIssues}
            onDatasetChange={applyDataset}
            onSourceChange={setSource}
            onTargetChange={setTarget}
            onRunDijkstra={() => runAlgorithm("dijkstra")}
            onRunAStar={() => runAlgorithm("aStar")}
            onRunBoth={runBoth}
            onResetResults={resetResults}
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
