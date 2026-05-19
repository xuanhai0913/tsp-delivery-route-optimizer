import { GitBranch, Route, Zap } from "lucide-react";

export function GuidePage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>RouteLab Group 1: Phân tích & Giải thuật</h1>
          <p>
            Tài liệu tham khảo nhanh về bài toán TSP, thuật toán tham lam và kỹ thuật nhánh cận.
          </p>
        </div>
      </div>

      <div className="guide-tabs">
        <button className="active" type="button">
          Tổng quan TSP
        </button>
        <button type="button">Tham lam (Greedy)</button>
        <button type="button">Nhánh cận (Branch & Bound)</button>
        <button type="button">So sánh Tổng hợp</button>
      </div>

      <section className="panel theory-card wide">
        <div>
          <div className="section-title-inline">
            <Route size={24} />
            <h2>Bài toán Người chào hàng (TSP) là gì?</h2>
          </div>
          <p>
            TSP yêu cầu tìm một chu trình khép kín đi qua mỗi địa điểm đúng một lần và quay lại điểm
            xuất phát sao cho tổng chi phí nhỏ nhất. Trong bối cảnh giao hàng, mỗi đỉnh là địa điểm
            cần ghé, còn cạnh có trọng số là khoảng cách hoặc chi phí di chuyển.
          </p>
          <p>
            Bài toán thuộc nhóm khó khi số lượng điểm tăng, vì số route có thể kiểm tra tăng rất
            nhanh. Vì vậy demo này so sánh một heuristic nhanh với một phương pháp tối ưu cho dữ
            liệu nhỏ.
          </p>
          <div className="formula-row">
            <span>Đồ thị: G = (V, E)</span>
            <span>Trọng số: c(i, j) ≥ 0</span>
          </div>
        </div>
        <div className="theory-visual" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="theory-grid">
        <section className="panel theory-card">
          <div className="section-title-inline greedy-tone">
            <Zap size={24} />
            <h2>Thuật toán Tham lam (Greedy)</h2>
          </div>
          <h3>Chiến lược</h3>
          <p>
            Tại mỗi bước, thuật toán chọn đỉnh chưa thăm có chi phí nhỏ nhất từ vị trí hiện tại.
            Cách này dễ hiểu, chạy nhanh, nhưng chỉ ưu tiên lựa chọn tốt tại thời điểm hiện tại.
          </p>
          <div className="complexity-box">
            <span>Độ phức tạp thời gian:</span>
            <strong>O(n²)</strong>
          </div>
          <div className="pros-cons">
            <div>
              <h4>Ưu điểm</h4>
              <ul>
                <li>Tốc độ thực thi cực nhanh.</li>
                <li>Dễ cài đặt và giải thích.</li>
                <li>Phù hợp dữ liệu lớn cần phản hồi nhanh.</li>
              </ul>
            </div>
            <div>
              <h4>Nhược điểm</h4>
              <ul>
                <li>Không đảm bảo nghiệm tối ưu.</li>
                <li>Dễ mắc kẹt ở tối ưu cục bộ.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="panel theory-card">
          <div className="section-title-inline branch-tone">
            <GitBranch size={24} />
            <h2>Nhánh Cận (Branch & Bound)</h2>
          </div>
          <h3>Cơ chế Tìm kiếm & Cắt tỉa</h3>
          <p>
            Thuật toán duyệt cây trạng thái, lưu route hiện tại, chi phí hiện tại và lời giải tốt
            nhất. Nếu một nhánh không thể tốt hơn lời giải tốt nhất, nhánh đó được cắt bỏ.
          </p>
          <div className="complexity-box danger">
            <span>Độ phức tạp tệ nhất:</span>
            <strong>O(n!)</strong>
          </div>
          <div className="pros-cons">
            <div>
              <h4>Đặc tính</h4>
              <ul>
                <li>Đảm bảo nghiệm tối ưu.</li>
                <li>Cắt tỉa giúp giảm số trạng thái cần duyệt.</li>
              </ul>
            </div>
            <div>
              <h4>Giới hạn</h4>
              <ul>
                <li>Tốn tài nguyên khi số điểm tăng.</li>
                <li>Phù hợp demo nhỏ 5-10 điểm.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
