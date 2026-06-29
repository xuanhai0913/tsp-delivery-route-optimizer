import { lazy, Suspense, useMemo } from "react";
import { Download, FileDown, MapPinned, TrendingUp } from "lucide-react";
import { ComparisonTable } from "../components/ComparisonTable";
import { GraphVisualization } from "../components/GraphVisualization";
import type { Dataset, SolverState } from "../types/path";
import { buildComparisonRows } from "../utils/route";

const RouteMap = lazy(() => import("../components/RouteMap"));

type ReportPageProps = {
  dataset: Dataset;
  source: number;
  target: number;
  results: SolverState;
  onExportJson: () => void;
  onExportPng: () => void;
};

export function ReportPage({ dataset, source, target, results, onExportJson, onExportPng }: ReportPageProps) {
  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const visibleRoutes = { dijkstra: true, aStar: true, floydWarshall: true };
  const sourceNode = dataset.nodes.find((node) => node.id === source);
  const targetNode = dataset.nodes.find((node) => node.id === target);
  const bestCostRow = comparisonRows.find((row) => row.isBestCost);
  const fastestRow = comparisonRows.find((row) => row.isFastest);

  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>Kết quả thực nghiệm</h1>
          <p>Snapshot báo cáo hiệu suất cho bài toán shortest path đang chọn.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={onExportJson}>
            <FileDown size={17} />
            Xuất JSON kết quả
          </button>
          <button className="solid-button" type="button" onClick={onExportPng}>
            <Download size={17} />
            Xuất PNG
          </button>
        </div>
      </div>

      <div className="report-summary-grid">
        <section className="panel summary-card">
          <div className="section-title-inline">
            <MapPinned size={22} />
            <h2>Tóm tắt graph</h2>
          </div>
          <dl>
            <div>
              <dt>Nodes:</dt>
              <dd>{dataset.nodes.length}</dd>
            </div>
            <div>
              <dt>Edges:</dt>
              <dd>{dataset.edges.length}</dd>
            </div>
            <div>
              <dt>Nguồn → đích:</dt>
              <dd>{sourceNode?.name ?? source} → {targetNode?.name ?? target}</dd>
            </div>
            <div>
              <dt>Bộ dữ liệu:</dt>
              <dd>{dataset.name}</dd>
            </div>
          </dl>
        </section>

        <section className="insight-card">
          <div className="section-title-inline">
            <TrendingUp size={23} />
            <h2>Nhận xét chính</h2>
          </div>
          <ul>
            <li>
              {bestCostRow
                ? `${bestCostRow.name} đang có tổng chi phí thấp nhất trong kết quả hiện tại.`
                : "Chưa có kết quả, hãy chạy thuật toán ở Dashboard."}
            </li>
            <li>
              {fastestRow
                ? `${fastestRow.name} có thời gian chạy nhanh nhất trong lần demo này.`
                : "Runtime sẽ hiển thị sau khi backend trả kết quả."}
            </li>
            <li>
              Dijkstra là baseline chắc chắn; A* dùng heuristic tọa độ để ưu tiên hướng gần đích.
            </li>
          </ul>
        </section>
      </div>

      <section className="panel report-map-panel">
        <div className="panel-heading">
          <div className="section-title-inline">
            <MapPinned size={23} />
            <h2>Trực quan hóa shortest path</h2>
          </div>
        </div>
        <div className="report-map-grid">
          <Suspense fallback={<div className="map-skeleton">Đang tải bản đồ...</div>}>
            <RouteMap dataset={dataset} results={results} visibleRoutes={visibleRoutes} source={source} target={target} />
          </Suspense>
          <GraphVisualization dataset={dataset} results={results} visibleRoutes={visibleRoutes} />
        </div>
      </section>

      <section className="panel comparison-panel">
        <div className="section-title-inline">
          <span className="mini-icon" aria-hidden="true">
            ▥
          </span>
          <h2>Bảng so sánh hiệu suất thuật toán</h2>
        </div>
        <ComparisonTable rows={comparisonRows} />
      </section>
    </div>
  );
}
