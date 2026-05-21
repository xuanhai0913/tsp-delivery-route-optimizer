from __future__ import annotations

import math
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import Flowable, PageBreak, SimpleDocTemplate, Spacer

from build_routelab_report import (
    AStarFormula,
    FONT_BOLD,
    FONT_REGULAR,
    LOGO_PATH,
    PALETTE,
    REPORT_DIR,
    RelaxationFlow,
    callout,
    code_block,
    header_footer,
    heuristic,
    load_dataset,
    make_table,
    node_name,
    p,
    scaled_image,
    short_path,
    solve_a_star,
    solve_dijkstra,
    trace_rows,
)


DIJKSTRA_OUTPUT = REPORT_DIR / "dijkstra-guide.pdf"
A_STAR_OUTPUT = REPORT_DIR / "a-star-guide.pdf"


class StepFlow(Flowable):
    def __init__(self, width: float, steps: list[tuple[str, str]], accent):
        super().__init__()
        self.width = width
        self.steps = steps
        self.accent = accent
        self.height = 118

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["paper"])
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=0)
        gap = 10
        box_w = (self.width - 36 - gap * (len(self.steps) - 1)) / len(self.steps)
        y = 28
        for index, (title, body) in enumerate(self.steps):
            x = 18 + index * (box_w + gap)
            c.setFillColor(colors.white)
            c.setStrokeColor(self.accent)
            c.setLineWidth(1)
            c.roundRect(x, y, box_w, 62, 9, fill=1, stroke=1)
            c.setFillColor(self.accent)
            c.circle(x + 16, y + 45, 9, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont(FONT_BOLD, 7)
            c.drawCentredString(x + 16, y + 42.5, str(index + 1))
            c.setFillColor(PALETTE["ink"])
            c.setFont(FONT_BOLD, 7.5)
            c.drawString(x + 30, y + 43, title)
            c.setFont(FONT_REGULAR, 6.8)
            c.setFillColor(PALETTE["muted"])
            for line_index, line in enumerate(body.split("|")):
                c.drawString(x + 10, y + 26 - line_index * 10, line)
            if index < len(self.steps) - 1:
                c.setStrokeColor(PALETTE["muted"])
                c.line(x + box_w + 2, y + 31, x + box_w + gap - 2, y + 31)
                c.line(x + box_w + gap - 6, y + 35, x + box_w + gap - 2, y + 31)
                c.line(x + box_w + gap - 6, y + 27, x + box_w + gap - 2, y + 31)
        c.restoreState()


class PriorityQueueDiagram(Flowable):
    def __init__(self, width: float, algorithm: str):
        super().__init__()
        self.width = width
        self.algorithm = algorithm
        self.height = 120

    def draw(self):
        c = self.canv
        accent = PALETTE["purple"] if self.algorithm == "A*" else PALETTE["blue"]
        fill = PALETTE["purple_light"] if self.algorithm == "A*" else PALETTE["blue_light"]
        c.saveState()
        c.setFillColor(fill)
        c.setStrokeColor(accent)
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=1)
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_BOLD, 10.5)
        c.drawString(18, 92, "Priority queue minh họa")
        labels = [
            ("node 2", "cost 2.5"),
            ("node 0", "cost 3.4"),
            ("node 5", "cost 4.6"),
            ("node 6", "target"),
        ]
        if self.algorithm == "A*":
            labels = [
                ("node 2", "f = g + h"),
                ("node 3", "g tốt, h nhỏ"),
                ("node 0", "xa target hơn"),
                ("node 6", "target"),
            ]
        box_w = (self.width - 60) / len(labels)
        for index, (title, note) in enumerate(labels):
            x = 18 + index * (box_w + 8)
            y = 36
            c.setFillColor(colors.white)
            c.setStrokeColor(accent)
            c.roundRect(x, y, box_w, 38, 8, fill=1, stroke=1)
            c.setFillColor(accent)
            c.setFont(FONT_BOLD, 8)
            c.drawCentredString(x + box_w / 2, y + 22, title)
            c.setFillColor(PALETTE["muted"])
            c.setFont(FONT_REGULAR, 6.8)
            c.drawCentredString(x + box_w / 2, y + 10, note)
        c.setFillColor(PALETTE["muted"])
        c.setFont(FONT_REGULAR, 7.2)
        c.drawString(18, 16, "Node có độ ưu tiên nhỏ nhất được lấy ra trước; sau đó thuật toán relax các cạnh đi ra.")
        c.restoreState()


def cover_story(title: str, subtitle: str, accent=PALETTE["blue"]) -> list:
    story = []
    logo = scaled_image(LOGO_PATH, 7.2 * cm, 1.55 * cm)
    if logo:
        story.append(logo)
        story.append(Spacer(1, 0.5 * cm))
    fill = PALETTE["blue_light"] if accent == PALETTE["blue"] else PALETTE["purple_light"]
    story.append(callout("Tài liệu thuật toán", subtitle, accent, fill))
    story.append(Spacer(1, 0.45 * cm))
    story.append(p(title, "CoverTitle"))
    story.append(
        make_table(
            [
                ["Dự án", "RouteLab Group 1 - Shortest Path Visualizer"],
                ["Mục tiêu", "Giải thích thuật toán, contract dữ liệu, pseudocode, trace demo và checklist kiểm thử."],
                ["Dataset minh họa", "Ho Chi Minh City graph, 7 nodes, source = 1, target = 6"],
            ],
            col_widths=[4.0 * cm, 12.6 * cm],
            font_size=9,
        )
    )
    story.append(PageBreak())
    return story


def build_dijkstra_pdf() -> None:
    dataset = load_dataset()
    source = dataset["defaultSource"]
    target = dataset["defaultTarget"]
    result = solve_dijkstra(dataset, source, target)
    doc = SimpleDocTemplate(
        str(DIJKSTRA_OUTPUT),
        pagesize=A4,
        leftMargin=1.45 * cm,
        rightMargin=1.45 * cm,
        topMargin=1.65 * cm,
        bottomMargin=1.35 * cm,
        title="RouteLab - Dijkstra Guide",
        author="RouteLab Group 1",
    )
    story = cover_story(
        "Dijkstra Shortest Path",
        "Tài liệu riêng giải thích cách Dijkstra tìm đường ngắn nhất trên graph có trọng số không âm.",
        PALETTE["blue"],
    )
    story.append(p("1. Ý Tưởng Chính", "H1"))
    story.append(
        p(
            "Dijkstra giải bài toán đường đi ngắn nhất từ một nguồn đến các node còn lại. Trong demo RouteLab, ta dừng sớm khi target được lấy ra khỏi priority queue vì lúc đó distance của target đã là tối ưu.",
            "Body",
        )
    )
    story.append(
        StepFlow(
            16.8 * cm,
            [
                ("Khởi tạo", "dist[source] = 0|node khác = infinity"),
                ("Chọn min", "Pop node có|distance nhỏ nhất"),
                ("Relax", "Thử cải thiện|các cạnh đi ra"),
                ("Lưu previous", "Ghi node trước|để dựng path"),
                ("Dừng", "Khi target được|pop khỏi queue"),
            ],
            PALETTE["blue"],
        )
    )
    story.append(RelaxationFlow(16.8 * cm))
    story.append(p("2. Input, Output Và API Contract", "H1"))
    story.append(
        make_table(
            [
                ["Thành phần", "Ý nghĩa"],
                ["source", "ID node bắt đầu."],
                ["target", "ID node cần đi tới."],
                ["nodes", "Danh sách điểm trên graph, có id/name/lat/lng."],
                ["edges", "Danh sách cạnh có from/to/weight; weight không âm."],
                ["path", "Chuỗi node từ source đến target."],
                ["visitedOrder", "Thứ tự node được lấy ra khỏi priority queue."],
                ["relaxedEdges", "Các cạnh đã được relax để phục vụ animation/demo."],
            ],
            col_widths=[3.8 * cm, 12.8 * cm],
            font_size=8.8,
        )
    )
    story.append(code_block("""
POST /api/solve/dijkstra

Request:
{
  "source": 1,
  "target": 6,
  "nodes": [{ "id": 1, "name": "Ben Thanh Market", "lat": 10.7725, "lng": 106.698 }],
  "edges": [{ "id": "e1-2", "from": 1, "to": 2, "weight": 2.5 }],
  "directed": false
}

Response:
{
  "path": [1, 2, 3, 6],
  "totalCost": 7.5,
  "runtimeMs": 0.18,
  "visitedOrder": [1, 2, 0, 5, 3, 6],
  "relaxedEdges": [{ "from": 1, "to": 2, "cumulativeCost": 2.5 }]
}
"""))
    story.append(PageBreak())
    story.append(p("3. Pseudocode Và Cách Cài Đặt", "H1"))
    story.append(code_block("""
dist = map with infinity for every node
previous = empty map
dist[source] = 0
queue.push(source, priority = 0)

while queue is not empty:
    current = queue.popMin()
    if current is already finalized:
        continue

    mark current as finalized
    if current == target:
        break

    for each edge current -> neighbor:
        nextCost = dist[current] + edge.weight
        if nextCost < dist[neighbor]:
            dist[neighbor] = nextCost
            previous[neighbor] = current
            queue.push(neighbor, priority = nextCost)

return reconstructPath(previous, source, target)
"""))
    story.extend(
        [
            p("Các điểm cài đặt cần chú ý:", "H2"),
            *[
                p(f"<font color='#2563eb'>●</font> {escape(item)}", "Body")
                for item in [
                    "Không chấp nhận edge weight âm vì Dijkstra sẽ mất tính đúng.",
                    "Dùng min-heap để lấy node có distance nhỏ nhất nhanh hơn quét toàn bộ.",
                    "previous map giúp dựng lại path cuối cùng từ target về source.",
                    "visited/finalized set tránh xử lý lại node đã có distance tối ưu.",
                ]
            ],
        ]
    )
    story.append(p("4. Trace Trên Dataset HCM 7 Nodes", "H1"))
    story.append(make_table(trace_rows(dataset, result, 12), col_widths=[1.2 * cm, 5.5 * cm, 4.0 * cm, 3.2 * cm], font_size=7.8))
    story.append(Spacer(1, 0.18 * cm))
    story.append(
        callout(
            "Kết quả demo",
            f"Từ {source} ({node_name(dataset, source)}) đến {target} ({node_name(dataset, target)}), Dijkstra tìm path {short_path(result.path)} với totalCost = {result.total_cost:g}.",
            PALETTE["blue"],
            PALETTE["blue_light"],
        )
    )
    story.append(PageBreak())
    story.append(p("5. Độ Phức Tạp", "H1"))
    story.append(
        make_table(
            [
                ["Đại lượng", "Phân tích"],
                ["Thời gian", "O((V + E) log V) với binary heap."],
                ["Bộ nhớ", "O(V + E) cho adjacency list, dist, previous, queue."],
                ["Tính đúng", "Đúng với graph có trọng số không âm."],
                ["Tác động khi graph lớn", "Duyệt nhiều node nếu không có heuristic hướng về target."],
            ],
            col_widths=[4.0 * cm, 12.6 * cm],
            font_size=8.8,
        )
    )
    story.append(p("6. Checklist Kiểm Thử", "H1"))
    story.extend(
        [
            p(f"<font color='#00897b'>✓</font> {escape(item)}", "Body")
            for item in [
                "Trả path bắt đầu bằng source và kết thúc bằng target.",
                "totalCost khớp tổng weight của các cạnh trong path.",
                "Reject graph có weight âm hoặc edge trỏ tới node không tồn tại.",
                "Case source/target không nối được phải trả lỗi rõ ràng.",
                "So sánh với graph nhỏ có shortest path biết trước.",
            ]
        ]
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_a_star_pdf() -> None:
    dataset = load_dataset()
    source = dataset["defaultSource"]
    target = dataset["defaultTarget"]
    result = solve_a_star(dataset, source, target)
    dijkstra = solve_dijkstra(dataset, source, target)
    doc = SimpleDocTemplate(
        str(A_STAR_OUTPUT),
        pagesize=A4,
        leftMargin=1.45 * cm,
        rightMargin=1.45 * cm,
        topMargin=1.65 * cm,
        bottomMargin=1.35 * cm,
        title="RouteLab - A Star Guide",
        author="RouteLab Group 1",
    )
    story = cover_story(
        "A* Search",
        "Tài liệu riêng giải thích A* với công thức f(n) = g(n) + h(n) và heuristic theo tọa độ.",
        PALETTE["purple"],
    )
    story.append(p("1. Vì Sao Cần A*?", "H1"))
    story.append(
        p(
            "Dijkstra không biết target nằm ở đâu nên có thể mở rộng nhiều node không cần thiết. A* thêm heuristic h(n) để ưu tiên node có vẻ gần target hơn, từ đó mô phỏng cách tìm đường trên bản đồ trực quan hơn.",
            "Body",
        )
    )
    story.append(AStarFormula(16.8 * cm))
    story.append(
        StepFlow(
            16.8 * cm,
            [
                ("g(n)", "Cost đã đi|từ source đến n"),
                ("h(n)", "Ước lượng cost|từ n đến target"),
                ("f(n)", "Ưu tiên queue|bằng g + h"),
                ("Relax", "Cập nhật g tốt|hơn nếu có"),
                ("Dừng", "Khi target được|pop khỏi queue"),
            ],
            PALETTE["purple"],
        )
    )
    story.append(PriorityQueueDiagram(16.8 * cm, "A*"))
    story.append(p("2. Heuristic Trong Project", "H1"))
    story.append(
        p(
            "Demo dùng tọa độ lat/lng của node để tính khoảng cách đường chim bay đến target, sau đó scale xuống để giữ ước lượng bảo thủ trên graph giả lập. Khi heuristic không vượt chi phí thật còn lại, A* vẫn tìm shortest path tối ưu.",
            "Body",
        )
    )
    heuristic_rows = [["Node", "Tên", "h(node, target)"]]
    for node in dataset["nodes"]:
        heuristic_rows.append([str(node["id"]), node["name"], f"{heuristic(dataset, node['id'], target):.3f}"])
    story.append(make_table(heuristic_rows, col_widths=[1.3 * cm, 10.5 * cm, 3.4 * cm], font_size=8.1, alignments={0: "CENTER", 2: "CENTER"}))
    story.append(code_block("""
function heuristic(node, target):
    return haversineDistance(node.latLng, target.latLng) * conservativeScale

priority(node) = gScore[node] + heuristic(node, target)
"""))
    story.append(PageBreak())
    story.append(p("3. Pseudocode Và Cách Cài Đặt", "H1"))
    story.append(code_block("""
gScore = map with infinity for every node
previous = empty map
gScore[source] = 0
queue.push(source, priority = heuristic(source, target))

while queue is not empty:
    current = queue.popMin()
    if current == target:
        break

    for each edge current -> neighbor:
        tentativeG = gScore[current] + edge.weight
        if tentativeG < gScore[neighbor]:
            previous[neighbor] = current
            gScore[neighbor] = tentativeG
            fScore = tentativeG + heuristic(neighbor, target)
            queue.push(neighbor, priority = fScore)

return reconstructPath(previous, source, target)
"""))
    story.extend(
        [
            p("Các điểm cài đặt cần chú ý:", "H2"),
            *[
                p(f"<font color='#7c3aed'>●</font> {escape(item)}", "Body")
                for item in [
                    "A* không thay thế validator: edge weight vẫn phải không âm.",
                    "Nếu heuristic quá cao, A* có thể mất bảo đảm tối ưu.",
                    "Khi h(n) = 0 cho mọi node, A* trở thành Dijkstra.",
                    "Frontend nên hiển thị g, h, f để người xem hiểu vì sao một node được ưu tiên.",
                ]
            ],
        ]
    )
    story.append(p("4. Trace Trên Dataset HCM 7 Nodes", "H1"))
    story.append(make_table(trace_rows(dataset, result, 12), col_widths=[1.2 * cm, 5.5 * cm, 4.0 * cm, 3.2 * cm], font_size=7.8))
    story.append(
        callout(
            "Kết quả demo",
            f"A* tìm path {short_path(result.path)} với totalCost = {result.total_cost:g}. Dijkstra trên cùng dataset tìm path {short_path(dijkstra.path)} với totalCost = {dijkstra.total_cost:g}.",
            PALETTE["purple"],
            PALETTE["purple_light"],
        )
    )
    story.append(PageBreak())
    story.append(p("5. Độ Phức Tạp", "H1"))
    story.append(
        make_table(
            [
                ["Đại lượng", "Phân tích"],
                ["Worst-case", "Có thể tương tự Dijkstra nếu heuristic yếu hoặc không hữu ích."],
                ["Thực tế demo", "Có thể duyệt ít node hơn khi h(n) định hướng tốt về target."],
                ["Bộ nhớ", "O(V + E) cho graph, gScore, previous, queue và trace animation."],
                ["Tính tối ưu", "Giữ được nếu heuristic admissible và graph có trọng số không âm."],
            ],
            col_widths=[4.0 * cm, 12.6 * cm],
            font_size=8.8,
        )
    )
    story.append(p("6. So Sánh Với Dijkstra", "H1"))
    story.append(
        make_table(
            [
                ["Thuật toán", "Path", "Total cost", "Visited nodes", "Ý nghĩa"],
                ["Dijkstra", short_path(dijkstra.path), f"{dijkstra.total_cost:g}", short_path(dijkstra.visited_order), "Baseline chắc chắn."],
                ["A*", short_path(result.path), f"{result.total_cost:g}", short_path(result.visited_order), "Ưu tiên node gần target hơn."],
            ],
            col_widths=[3.0 * cm, 3.2 * cm, 2.0 * cm, 4.5 * cm, 3.9 * cm],
            font_size=7.8,
            alignments={2: "CENTER"},
        )
    )
    story.append(p("7. Checklist Kiểm Thử", "H1"))
    story.extend(
        [
            p(f"<font color='#00897b'>✓</font> {escape(item)}", "Body")
            for item in [
                "A* trả cùng totalCost với Dijkstra trên các graph có heuristic admissible.",
                "Case h(n) = 0 phải cho hành vi như Dijkstra.",
                "Heuristic không âm và target có h(target) = 0.",
                "Trace relaxedEdges đủ dữ liệu để frontend animate.",
                "Dataset demo có nhánh rẽ rõ để A* thể hiện lợi thế.",
            ]
        ]
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    build_dijkstra_pdf()
    build_a_star_pdf()
    print(DIJKSTRA_OUTPUT)
    print(A_STAR_OUTPUT)
