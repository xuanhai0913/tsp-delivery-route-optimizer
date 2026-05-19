import { lazy, Suspense, useMemo } from "react";
import { Download, FileDown, MapPinned, TrendingUp } from "lucide-react";
import { ComparisonTable } from "../components/ComparisonTable";
import { GraphVisualization } from "../components/GraphVisualization";
import type { Dataset, SolverState } from "../types/tsp";
import { buildComparisonRows } from "../utils/route";

const RouteMap = lazy(() => import("../components/RouteMap"));

type ReportPageProps = {
  dataset: Dataset;
  start: number;
  results: SolverState;
  onExportJson: () => void;
  onExportPng: () => void;
};

export function ReportPage({ dataset, start, results, onExportJson, onExportPng }: ReportPageProps) {
  const comparisonRows = useMemo(() => buildComparisonRows(results), [results]);
  const visibleRoutes = { greedy: true, branchAndBound: true };
  const startLocation = dataset.locations.find((location) => location.id === start);
  const bestCostRow = comparisonRows.find((row) => row.isBestCost);
  const fastestRow = comparisonRows.find((row) => row.isFastest);

  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>Kết quả thực nghiệm</h1>
          <p>Snapshot báo cáo tổng quan hiệu suất cho bộ dữ liệu đang chọn.</p>
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
            <h2>Tóm tắt tập dữ liệu</h2>
          </div>
          <dl>
            <div>
              <dt>Số lượng điểm:</dt>
              <dd>{dataset.locations.length} Node</dd>
            </div>
            <div>
              <dt>Điểm xuất phát:</dt>
              <dd>{startLocation?.name ?? start}</dd>
            </div>
            <div>
              <dt>Bộ dữ liệu:</dt>
              <dd>{dataset.name}</dd>
            </div>
            <div>
              <dt>Mã phiên chạy:</dt>
              <dd>RUN-2026-05</dd>
            </div>
          </dl>
        </section>

        <section className="insight-card">
          <div className="section-title-inline">
            <TrendingUp size={23} />
            <h2>Nhận xét chính (Key Insights)</h2>
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
                : "Runtime sẽ hiển thị sau khi mock solver hoàn tất."}
            </li>
            <li>
              Greedy phù hợp phản hồi nhanh; Branch and Bound dùng để chứng minh nghiệm tối ưu với
              dữ liệu nhỏ.
            </li>
          </ul>
        </section>
      </div>

      <section className="panel report-map-panel">
        <div className="panel-heading">
          <div className="section-title-inline">
            <MapPinned size={23} />
            <h2>Trực quan hóa lộ trình tối ưu</h2>
          </div>
          <div className="small-segmented">
            <button type="button">Bản đồ nhiệt</button>
            <button type="button">Lưới tọa độ</button>
          </div>
        </div>
        <div className="report-map-grid">
          <Suspense fallback={<div className="map-skeleton">Đang tải bản đồ...</div>}>
            <RouteMap dataset={dataset} results={results} visibleRoutes={visibleRoutes} start={start} />
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
