import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { GuidePage } from "./pages/GuidePage";
import { ReportPage } from "./pages/ReportPage";
import { mockDatasets } from "./data/mockDatasets";
import { datasetClient } from "./services/datasetClient";
import { solverClient } from "./services/solverClient";
import type { AlgorithmKey, Dataset, SolverState } from "./types/path";
import { downloadJson, exportElementToPng } from "./utils/export";
import { hasBlockingIssue, validateDataset } from "./utils/validation";

export type ViewKey = "dashboard" | "data" | "report" | "guide";

const initialDataset = mockDatasets[0];

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
  const exportRef = useRef<HTMLDivElement>(null);

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
        setStatusMessage(
          result.source === "backend"
            ? "Đã tải graph từ backend."
            : "Backend tạm thời chậm, đang dùng dữ liệu mock local."
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
        setStatusMessage(error instanceof Error ? error.message : "Không thể tải graph từ backend.");
      });

    return () => {
      isCancelled = true;
    };
  }, []);

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
    setDatasets((current) => {
      const hasDataset = current.some((item) => item.id === nextDataset.id);
      return hasDataset
        ? current.map((item) => (item.id === nextDataset.id ? nextDataset : item))
        : [nextDataset, ...current];
    });
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
    setStatusMessage(algorithm === "dijkstra" ? "Đang gọi backend Dijkstra..." : "Đang gọi backend A*...");

    try {
      const result =
        algorithm === "dijkstra"
          ? await solverClient.solveDijkstra(request)
          : await solverClient.solveAStar(request);
      setResults((current) => ({ ...current, [algorithm]: result }));
      setStatusMessage(
        result.resultSource === "mock"
          ? `${algorithm === "dijkstra" ? "Dijkstra" : "A*"} dùng fallback mock local.`
          : `Đã nhận kết quả ${algorithm === "dijkstra" ? "Dijkstra" : "A*"} từ backend.`
      );
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
    setStatusMessage("Đang gọi backend Dijkstra và A* để so sánh...");

    try {
      const [dijkstra, aStar] = await Promise.all([
        solverClient.solveDijkstra(request),
        solverClient.solveAStar(request),
      ]);
      setResults({ dijkstra, aStar });
      setStatusMessage(
        dijkstra.resultSource === "mock" || aStar.resultSource === "mock"
          ? "Backend tạm thời chậm, đã dùng fallback mock local để so sánh."
          : "Đã nhận kết quả so sánh shortest path từ backend."
      );
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
            datasets={datasets}
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
