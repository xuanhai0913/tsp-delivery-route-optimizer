import { GitBranch, Route, Zap } from "lucide-react";

export function GuidePage() {
  return (
    <div className="page-stack page-enter">
      <div className="page-header-row">
        <div>
          <h1>RouteLab Group 1: Shortest Path</h1>
          <p>
            Tài liệu tham khảo nhanh về mô phỏng tìm đường ngắn nhất bằng Dijkstra và A*.
          </p>
        </div>
      </div>

      <div className="guide-tabs">
        <button className="active" type="button">
          Tổng quan graph
        </button>
        <button type="button">Dijkstra</button>
        <button type="button">A*</button>
        <button type="button">So sánh</button>
      </div>

      <section className="panel theory-card wide">
        <div>
          <div className="section-title-inline">
            <Route size={24} />
            <h2>Bài toán shortest path là gì?</h2>
          </div>
          <p>
            Shortest path tìm đường đi có tổng trọng số nhỏ nhất từ một node nguồn tới một node
            đích trên graph. Trong demo này, node là địa điểm trên bản đồ và cạnh có trọng số là
            chi phí hoặc khoảng cách tương đối.
          </p>
          <p>
            Map chỉ dùng để trực quan hóa graph và path. Dự án không phân tích hệ thống Google Maps
            thật, mà mô phỏng hai thuật toán nền tảng thường học trong môn phân tích thiết kế giải thuật.
          </p>
          <div className="formula-row">
            <span>Graph: G = (V, E)</span>
            <span>Weight: w(u, v) ≥ 0</span>
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
            <GitBranch size={24} />
            <h2>Dijkstra</h2>
          </div>
          <h3>Chiến lược</h3>
          <p>
            Dijkstra dùng hàng đợi ưu tiên để luôn mở rộng node có khoảng cách tạm thời nhỏ nhất.
            Mỗi lần duyệt cạnh, thuật toán thực hiện relaxation để cập nhật đường đi tốt hơn.
          </p>
          <div className="complexity-box">
            <span>Độ phức tạp phổ biến:</span>
            <strong>O((V + E) log V)</strong>
          </div>
          <div className="pros-cons">
            <div>
              <h4>Ưu điểm</h4>
              <ul>
                <li>Đảm bảo shortest path với trọng số không âm.</li>
                <li>Dễ giải thích bằng distance table và predecessor.</li>
              </ul>
            </div>
            <div>
              <h4>Giới hạn</h4>
              <ul>
                <li>Không dùng thông tin vị trí đích để định hướng tìm kiếm.</li>
                <li>Có thể duyệt nhiều node không nằm gần path cuối cùng.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="panel theory-card">
          <div className="section-title-inline branch-tone">
            <Zap size={24} />
            <h2>A*</h2>
          </div>
          <h3>Heuristic search</h3>
          <p>
            A* ưu tiên node theo công thức f(n) = g(n) + h(n). Trong đó g(n) là chi phí đã đi từ
            nguồn tới n, còn h(n) ước lượng chi phí còn lại từ n tới đích.
          </p>
          <div className="complexity-box danger">
            <span>Điều kiện tối ưu:</span>
            <strong>h(n) không vượt chi phí thật</strong>
          </div>
          <div className="pros-cons">
            <div>
              <h4>Ưu điểm</h4>
              <ul>
                <li>Thường duyệt ít node hơn Dijkstra khi heuristic tốt.</li>
                <li>Rất trực quan trên map nhờ hướng tìm kiếm về phía đích.</li>
              </ul>
            </div>
            <div>
              <h4>Lưu ý</h4>
              <ul>
                <li>Heuristic sai có thể làm mất tính tối ưu.</li>
                <li>Cần giải thích rõ f, g, h trong báo cáo.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
