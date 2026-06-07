# Demo Script

## Mục Tiêu

Demo RouteLab như một hệ thống mô phỏng tìm đường ngắn nhất trên graph bản đồ.
Không giới thiệu đây là Google Maps thật; map chỉ là lớp trực quan cho bài toán
đồ thị có trọng số.

## Kịch Bản 3-5 Phút

1. Mở [maps.hailamdev.space](https://maps.hailamdev.space) và giới thiệu dataset `Ho Chi Minh City shortest-path graph`.
2. Chỉ vào input graph: mỗi node là một địa điểm, mỗi edge là một đoạn đường có trọng số và road geometry.
3. Chọn source `Ben Thanh Market`, target `Saigon Zoo`.
4. Bấm `Chạy Dijkstra`. Giải thích Dijkstra luôn chọn node có `dist` nhỏ nhất trong priority queue rồi relax các cạnh kề.
5. Bấm `Chạy A*`. Giải thích A* dùng `f(n) = g(n) + h(n)`, trong đó `h(n)` là ước lượng khoảng cách theo tọa độ tới đích.
6. Khi Bellman-Ford được nối API, giải thích thuật toán relax toàn bộ cạnh `V - 1` lần và có thể phát hiện negative cycle.
7. Khi Floyd-Warshall được nối API, giải thích thuật toán cập nhật ma trận khoảng cách qua từng node trung gian `k`.
8. Bấm `Chạy tất cả` nếu muốn reset kết quả so sánh cùng lúc.
9. Dùng playback: chuyển từng bước để chỉ ra current node, relaxed edge, priority queue hoặc bảng trạng thái.
10. Chốt bảng so sánh: trên graph không âm, bốn thuật toán nên cho cùng shortest path/cost; khác nhau ở cách duyệt và độ phức tạp.

## Câu Nói Gợi Ý

- "Dijkstra là baseline chắc chắn vì trọng số không âm."
- "A* thêm heuristic nên có xu hướng đi về phía đích thay vì mở rộng đều."
- "Bellman-Ford chậm hơn nhưng giúp giải thích relaxation lặp lại và negative cycle."
- "Floyd-Warshall mạnh khi cần shortest path cho mọi cặp node, đổi lại chi phí O(V^3)."
- "Replay ở đây cho thấy quá trình thuật toán, không chỉ vẽ path cuối."
- "Nếu backend Render cold start, app có fallback local để demo không bị ngắt."

## Checklist Trước Khi Thuyết Trình

- Status hiển thị `Đã tải graph từ backend.`
- Sau khi chạy, status hiển thị `Đã nhận kết quả ... từ backend.`
- Map có marker/node và đường đi, Graph tab có edge highlight.
- Bảng trạng thái thuật toán đổi theo playback.
- Không còn nhắc scope cũ trong phần trình bày.
