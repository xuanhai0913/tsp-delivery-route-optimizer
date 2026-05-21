# Report

Thư mục này chứa tài liệu PDF phục vụ báo cáo và thuyết trình cho scope mới:
**mô phỏng tìm đường ngắn nhất trên bản đồ bằng Dijkstra và A\***.

## File đã xuất

- `routelab-shortest-path-report.pdf`: báo cáo tổng quan project, kiến trúc, API, dữ liệu graph, kết quả thực nghiệm và hướng phát triển.
- `dijkstra-guide.pdf`: tài liệu riêng giải thích Dijkstra, relaxation, priority queue, độ phức tạp và checklist kiểm thử.
- `a-star-guide.pdf`: tài liệu riêng giải thích A*, công thức `f(n) = g(n) + h(n)`, heuristic theo tọa độ và so sánh với Dijkstra.

## Cách xuất lại PDF

Dùng Python runtime có `reportlab`:

```bash
python3 docs/report/build_routelab_report.py
python3 docs/report/build_algorithm_guides.py
```

Nếu máy chưa cài `reportlab`, có thể dùng virtualenv riêng hoặc runtime bundled của Codex.
