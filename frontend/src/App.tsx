import { useMemo, useRef, useState, useTransition } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { GuidePage } from "./pages/GuidePage";
import { ReportPage } from "./pages/ReportPage";
import { mockDatasets } from "./data/mockDatasets";
import { solverClient } from "./services/solverClient";
import type { AlgorithmKey, Dataset, SolverState } from "./types/tsp";
import { downloadJson, exportElementToPng } from "./utils/export";
import { hasBlockingIssue, validateDataset } from "./utils/validation";

export type ViewKey = "dashboard" | "data" | "report" | "guide";

const initialDataset = mockDatasets[0];

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [isNavigating, startNavigationTransition] = useTransition();
  const [dataset, setDataset] = useState<Dataset>(initialDataset);
  const [start, setStart] = useState(0);
  const [results, setResults] = useState<SolverState>({});
  const [solving, setSolving] = useState<Partial<Record<AlgorithmKey, boolean>>>({});
  const [statusMessage, setStatusMessage] = useState("Dữ liệu mẫu đã sẵn sàng.");
  const exportRef = useRef<HTMLDivElement>(null);

  const validationIssues = useMemo(() => validateDataset(dataset, start), [dataset, start]);
  const isBlocked = useMemo(() => hasBlockingIssue(validationIssues), [validationIssues]);

  const switchView = (view: ViewKey) => {
    startNavigationTransition(() => {
      setActiveView(view);
    });
  };

  const applyDataset = (nextDataset: Dataset) => {
    setDataset(nextDataset);
    setStart(0);
    setResults({});
    setStatusMessage("Đã áp dụng dữ liệu mới. Có thể chạy thuật toán.");
    switchView("dashboard");
  };

  const runAlgorithm = async (algorithm: AlgorithmKey) => {
    if (isBlocked) {
      setStatusMessage("Vui lòng sửa lỗi dữ liệu trước khi chạy thuật toán.");
      return;
    }

    const request = { start, costMatrix: dataset.costMatrix };
    setSolving((current) => ({ ...current, [algorithm]: true }));
    setStatusMessage(
      algorithm === "greedy"
        ? "Đang chạy Greedy nearest-neighbor..."
        : "Đang chạy Branch and Bound..."
    );

    try {
      const result =
        algorithm === "greedy"
          ? await solverClient.solveGreedy(request)
          : await solverClient.solveBranchAndBound(request);
      setResults((current) => ({ ...current, [algorithm]: result }));
      setStatusMessage(`${algorithm === "greedy" ? "Greedy" : "Branch and Bound"} đã hoàn thành.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
    } finally {
      setSolving((current) => ({ ...current, [algorithm]: false }));
    }
  };

  const runBoth = async () => {
    if (isBlocked) {
      setStatusMessage("Vui lòng sửa lỗi dữ liệu trước khi chạy thuật toán.");
      return;
    }

    const request = { start, costMatrix: dataset.costMatrix };
    setSolving({ greedy: true, branchAndBound: true });
    setStatusMessage("Đang chạy cả hai thuật toán để so sánh...");

    try {
      const [greedy, branchAndBound] = await Promise.all([
        solverClient.solveGreedy(request),
        solverClient.solveBranchAndBound(request),
      ]);
      setResults({ greedy, branchAndBound });
      setStatusMessage("Đã có kết quả so sánh.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Không thể chạy thuật toán.");
    } finally {
      setSolving({ greedy: false, branchAndBound: false });
    }
  };

  const resetResults = () => {
    setResults({});
    setSolving({});
    setStatusMessage("Đã xóa kết quả. Dữ liệu vẫn được giữ nguyên.");
  };

  const exportJson = () => {
    downloadJson(dataset, start, results);
    setStatusMessage("Đã xuất JSON kết quả.");
  };

  const exportPng = async () => {
    if (!exportRef.current) {
      return;
    }

    setStatusMessage("Đang xuất ảnh PNG...");
    await exportElementToPng(exportRef.current, `tsp-${dataset.id}-snapshot.png`);
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
            start={start}
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
            start={start}
            results={results}
            solving={solving}
            statusMessage={statusMessage}
            validationIssues={validationIssues}
            onDatasetChange={applyDataset}
            onStartChange={setStart}
            onRunGreedy={() => runAlgorithm("greedy")}
            onRunBranchAndBound={() => runAlgorithm("branchAndBound")}
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
