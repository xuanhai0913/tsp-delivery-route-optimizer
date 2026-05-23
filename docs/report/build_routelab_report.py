from __future__ import annotations

import heapq
import json
import math
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    Image,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / "docs" / "report"
DATASET_PATH = ROOT / "data" / "samples" / "hcm-7.json"
OUTPUT_PATH = REPORT_DIR / "routelab-shortest-path-report.pdf"
LOGO_PATH = ROOT / "frontend" / "public" / "brand" / "logo-horizontal.png"
DASHBOARD_SCREENSHOT = ROOT / "docs" / "assets" / "screenshots" / "dashboard.png"


PALETTE = {
    "ink": colors.HexColor("#12211f"),
    "muted": colors.HexColor("#5d6f69"),
    "teal": colors.HexColor("#00897b"),
    "teal_dark": colors.HexColor("#00695c"),
    "teal_light": colors.HexColor("#def7f1"),
    "purple": colors.HexColor("#7c3aed"),
    "purple_light": colors.HexColor("#efe7ff"),
    "blue": colors.HexColor("#2563eb"),
    "blue_light": colors.HexColor("#e8f0ff"),
    "amber": colors.HexColor("#f59e0b"),
    "amber_light": colors.HexColor("#fff2cc"),
    "red": colors.HexColor("#ba1a1a"),
    "red_light": colors.HexColor("#fde7e7"),
    "line": colors.HexColor("#d7e0dd"),
    "paper": colors.HexColor("#f7fbfa"),
    "white": colors.white,
}


def register_fonts() -> tuple[str, str, str]:
    regular_candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    bold_candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    italic_candidates = [
        "/System/Library/Fonts/Supplemental/Arial Italic.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]

    def first_existing(candidates: list[str]) -> str:
        for candidate in candidates:
            if Path(candidate).exists():
                return candidate
        raise FileNotFoundError("No Unicode-capable font was found.")

    regular = first_existing(regular_candidates)
    bold = first_existing(bold_candidates)
    italic = first_existing(italic_candidates)

    pdfmetrics.registerFont(TTFont("RouteLab-Regular", regular))
    pdfmetrics.registerFont(TTFont("RouteLab-Bold", bold))
    pdfmetrics.registerFont(TTFont("RouteLab-Italic", italic))
    pdfmetrics.registerFontFamily(
        "RouteLab",
        normal="RouteLab-Regular",
        bold="RouteLab-Bold",
        italic="RouteLab-Italic",
        boldItalic="RouteLab-Bold",
    )
    return "RouteLab-Regular", "RouteLab-Bold", "RouteLab-Italic"


FONT_REGULAR, FONT_BOLD, FONT_ITALIC = register_fonts()


@dataclass
class PathResult:
    algorithm: str
    path: list[int]
    total_cost: float
    runtime_ms: float
    visited_order: list[int]
    relaxed_edges: list[dict[str, float]]


def load_dataset() -> dict:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def node_name(dataset: dict, node_id: int) -> str:
    return next(node["name"] for node in dataset["nodes"] if node["id"] == node_id)


def node_lookup(dataset: dict) -> dict[int, dict]:
    return {node["id"]: node for node in dataset["nodes"]}


def build_adjacency(dataset: dict) -> dict[int, list[tuple[int, float, str]]]:
    adjacency: dict[int, list[tuple[int, float, str]]] = {node["id"]: [] for node in dataset["nodes"]}
    directed = bool(dataset.get("directed", False))
    for edge in dataset["edges"]:
        adjacency[edge["from"]].append((edge["to"], float(edge["weight"]), edge["id"]))
        if not directed:
            adjacency[edge["to"]].append((edge["from"], float(edge["weight"]), edge["id"]))
    for neighbors in adjacency.values():
        neighbors.sort(key=lambda item: (item[1], item[0]))
    return adjacency


def reconstruct_path(previous: dict[int, int], source: int, target: int) -> list[int]:
    path = [target]
    current = target
    while current != source:
        current = previous[current]
        path.append(current)
    return list(reversed(path))


def calculate_path_cost(path: list[int], dataset: dict) -> float:
    adjacency = build_adjacency(dataset)
    total = 0.0
    for start, end in zip(path, path[1:]):
        total += next(weight for neighbor, weight, _edge_id in adjacency[start] if neighbor == end)
    return round(total, 2)


def haversine_km(a: dict, b: dict) -> float:
    radius = 6371.0
    lat1 = math.radians(float(a["lat"]))
    lat2 = math.radians(float(b["lat"]))
    delta_lat = math.radians(float(b["lat"]) - float(a["lat"]))
    delta_lng = math.radians(float(b["lng"]) - float(a["lng"]))
    value = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def heuristic(dataset: dict, node_id: int, target: int) -> float:
    nodes = node_lookup(dataset)
    # The graph weights are demo street costs. The coordinate distance is scaled
    # down to keep the heuristic conservative for this synthetic sample.
    return round(haversine_km(nodes[node_id], nodes[target]) * 0.55, 3)


def solve_dijkstra(dataset: dict, source: int, target: int) -> PathResult:
    started = time.perf_counter()
    adjacency = build_adjacency(dataset)
    distances = {node["id"]: math.inf for node in dataset["nodes"]}
    previous: dict[int, int] = {}
    distances[source] = 0.0
    queue: list[tuple[float, int]] = [(0.0, source)]
    visited: set[int] = set()
    visited_order: list[int] = []
    relaxed_edges: list[dict[str, float]] = []

    while queue:
        current_cost, current = heapq.heappop(queue)
        if current in visited:
            continue
        visited.add(current)
        visited_order.append(current)
        if current == target:
            break

        for neighbor, weight, _edge_id in adjacency[current]:
            next_cost = current_cost + weight
            if next_cost < distances[neighbor]:
                distances[neighbor] = next_cost
                previous[neighbor] = current
                relaxed_edges.append({"from": current, "to": neighbor, "cumulativeCost": round(next_cost, 2)})
                heapq.heappush(queue, (next_cost, neighbor))

    runtime = (time.perf_counter() - started) * 1000
    path = reconstruct_path(previous, source, target)
    return PathResult("Dijkstra", path, round(distances[target], 2), runtime, visited_order, relaxed_edges)


def solve_a_star(dataset: dict, source: int, target: int) -> PathResult:
    started = time.perf_counter()
    adjacency = build_adjacency(dataset)
    g_score = {node["id"]: math.inf for node in dataset["nodes"]}
    previous: dict[int, int] = {}
    g_score[source] = 0.0
    queue: list[tuple[float, float, int]] = [(heuristic(dataset, source, target), 0.0, source)]
    visited: set[int] = set()
    visited_order: list[int] = []
    relaxed_edges: list[dict[str, float]] = []

    while queue:
        _priority, current_g, current = heapq.heappop(queue)
        if current in visited:
            continue
        visited.add(current)
        visited_order.append(current)
        if current == target:
            break

        for neighbor, weight, _edge_id in adjacency[current]:
            tentative_g = current_g + weight
            if tentative_g < g_score[neighbor]:
                g_score[neighbor] = tentative_g
                previous[neighbor] = current
                f_score = tentative_g + heuristic(dataset, neighbor, target)
                relaxed_edges.append({"from": current, "to": neighbor, "cumulativeCost": round(tentative_g, 2)})
                heapq.heappush(queue, (f_score, tentative_g, neighbor))

    runtime = (time.perf_counter() - started) * 1000
    path = reconstruct_path(previous, source, target)
    return PathResult("A*", path, round(g_score[target], 2), runtime, visited_order, relaxed_edges)


def build_styles() -> dict[str, ParagraphStyle]:
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName=FONT_BOLD,
            fontSize=28,
            leading=33,
            textColor=PALETTE["ink"],
            alignment=TA_LEFT,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subtitle",
            parent=styles["Normal"],
            fontName=FONT_REGULAR,
            fontSize=12.2,
            leading=18,
            textColor=PALETTE["muted"],
            spaceAfter=14,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H1",
            parent=styles["Heading1"],
            fontName=FONT_BOLD,
            fontSize=18,
            leading=23,
            textColor=PALETTE["teal_dark"],
            spaceBefore=12,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H2",
            parent=styles["Heading2"],
            fontName=FONT_BOLD,
            fontSize=13.4,
            leading=18,
            textColor=PALETTE["ink"],
            spaceBefore=9,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.2,
            leading=15.2,
            textColor=PALETTE["ink"],
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.2,
            leading=11.3,
            textColor=PALETTE["muted"],
        )
    )
    styles.add(
        ParagraphStyle(
            name="Caption",
            parent=styles["BodyText"],
            fontName=FONT_ITALIC,
            fontSize=8.7,
            leading=11.8,
            textColor=PALETTE["muted"],
            alignment=TA_CENTER,
            spaceBefore=5,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Callout",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.8,
            leading=14,
            textColor=PALETTE["ink"],
            leftIndent=4,
            rightIndent=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.2,
            leading=10.2,
            textColor=colors.HexColor("#263238"),
            backColor=colors.HexColor("#f4f7f6"),
        )
    )
    return styles


STYLES = build_styles()


def p(text: str, style: str = "Body") -> Paragraph:
    return Paragraph(text, STYLES[style])


def bullet_items(items: Iterable[str], color=PALETTE["teal"]) -> list[Paragraph]:
    return [p(f"<font color='{color.hexval()}'>●</font> {escape(item)}", "Body") for item in items]


def code_block(text: str) -> Preformatted:
    return Preformatted(text.strip(), STYLES["CodeBlock"])


def path_to_text(path: list[int], dataset: dict) -> str:
    names = {node["id"]: node["name"] for node in dataset["nodes"]}
    return " → ".join(f"{index} ({names[index]})" for index in path)


def short_path(path: list[int]) -> str:
    return " → ".join(str(node) for node in path)


def table_cell(value) -> Paragraph:
    if isinstance(value, Paragraph):
        return value
    return p(escape(str(value)), "Small")


def make_table(data, col_widths=None, header=True, font_size=8.5, alignments=None) -> Table:
    wrapped = [[table_cell(cell) for cell in row] for row in data]
    table = Table(wrapped, colWidths=col_widths, repeatRows=1 if header else 0, hAlign="LEFT")
    style = [
        ("FONTNAME", (0, 0), (-1, -1), FONT_REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 3),
        ("TEXTCOLOR", (0, 0), (-1, -1), PALETTE["ink"]),
        ("GRID", (0, 0), (-1, -1), 0.35, PALETTE["line"]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fbfdfc")]),
    ]
    if header:
        style.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PALETTE["teal_dark"]),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
            ]
        )
    if alignments:
        for column, alignment in alignments.items():
            style.append(("ALIGN", (column, 0), (column, -1), alignment))
    table.setStyle(TableStyle(style))
    return table


class CoverBand(Flowable):
    def __init__(self, width: float, height: float):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["paper"])
        c.roundRect(0, 0, self.width, self.height, 18, fill=1, stroke=0)
        c.setStrokeColor(PALETTE["line"])
        c.setLineWidth(0.5)
        for row in range(5):
            y = 25 + row * (self.height - 50) / 4
            c.line(24, y, self.width - 24, y)
        for column in range(6):
            x = 30 + column * (self.width - 60) / 5
            c.line(x, 20, x, self.height - 20)
        points = [
            (52, 76, "S"),
            (138, 128, "2"),
            (226, 96, "5"),
            (316, 152, "3"),
            (410, 118, "6"),
        ]
        c.setStrokeColor(PALETTE["blue"])
        c.setLineWidth(4)
        for start, end in zip(points, points[1:]):
            c.line(start[0], start[1], end[0], end[1])
        c.setStrokeColor(PALETTE["purple"])
        c.setLineWidth(2.2)
        c.setDash([6, 4])
        c.line(52, 76, 138, 128)
        c.line(138, 128, 316, 152)
        c.line(316, 152, 410, 118)
        c.setDash([])
        for x, y, label in points:
            c.setFillColor(colors.white)
            c.setStrokeColor(PALETTE["teal_dark"])
            c.circle(x, y, 14, fill=1, stroke=1)
            c.setFillColor(PALETTE["teal_dark"])
            c.setFont(FONT_BOLD, 8.4)
            c.drawCentredString(x, y - 3, label)
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_BOLD, 13)
        c.drawString(self.width - 165, 42, "Dijkstra + A*")
        c.setFillColor(PALETTE["muted"])
        c.setFont(FONT_REGULAR, 8)
        c.drawString(self.width - 165, 26, "Shortest path on weighted graph")
        c.restoreState()


class ArchitectureDiagram(Flowable):
    def __init__(self, width: float, height: float = 205):
        super().__init__()
        self.width = width
        self.height = height

    def draw_box(self, x, y, w, h, title, lines, color):
        c = self.canv
        c.setFillColor(colors.white)
        c.setStrokeColor(color)
        c.setLineWidth(1.2)
        c.roundRect(x, y, w, h, 9, fill=1, stroke=1)
        c.setFillColor(color)
        c.roundRect(x, y + h - 18, w, 18, 9, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 8)
        c.drawString(x + 8, y + h - 13, title)
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_REGULAR, 7.8)
        for index, line in enumerate(lines):
            c.drawString(x + 8, y + h - 32 - index * 11, line)

    def arrow(self, x1, y1, x2, y2):
        c = self.canv
        c.setStrokeColor(PALETTE["muted"])
        c.setLineWidth(1)
        c.line(x1, y1, x2, y2)
        angle = math.atan2(y2 - y1, x2 - x1)
        size = 5
        c.line(x2, y2, x2 - size * math.cos(angle - 0.45), y2 - size * math.sin(angle - 0.45))
        c.line(x2, y2, x2 - size * math.cos(angle + 0.45), y2 - size * math.sin(angle + 0.45))

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["paper"])
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=0)
        self.draw_box(18, 128, 128, 52, "React + Vite", ["Source/target controls", "Map + graph playback"], PALETTE["blue"])
        self.draw_box(194, 128, 128, 52, "Express API", ["Validate graph request", "Return JSON contract"], PALETTE["teal"])
        self.draw_box(370, 128, 128, 52, "Algorithms", ["Dijkstra", "A* + heuristic"], PALETTE["purple"])
        self.draw_box(194, 34, 128, 52, "Graph Data", ["JSON nodes", "Weighted edges"], PALETTE["teal_dark"])
        self.draw_box(370, 34, 128, 52, "Docs/Testing", ["Vitest + CI", "Report and demo script"], PALETTE["amber"])
        self.arrow(146, 154, 194, 154)
        self.arrow(322, 154, 370, 154)
        self.arrow(258, 128, 258, 86)
        self.arrow(434, 128, 434, 86)
        c.setFillColor(PALETTE["muted"])
        c.setFont(FONT_REGULAR, 7.5)
        c.drawString(155, 165, "HTTP")
        c.drawString(333, 165, "solver")
        c.restoreState()


class GraphMap(Flowable):
    def __init__(self, dataset: dict, dijkstra_path: list[int], a_star_path: list[int], width: float, height: float = 250):
        super().__init__()
        self.dataset = dataset
        self.dijkstra_path = dijkstra_path
        self.a_star_path = a_star_path
        self.width = width
        self.height = height

    def point_for(self, node):
        nodes = self.dataset["nodes"]
        latitudes = [item["lat"] for item in nodes]
        longitudes = [item["lng"] for item in nodes]
        margin = 28
        plot_w = self.width * 0.68
        plot_h = self.height - 2 * margin
        min_lng, max_lng = min(longitudes), max(longitudes)
        min_lat, max_lat = min(latitudes), max(latitudes)
        x = margin + (node["lng"] - min_lng) / (max_lng - min_lng) * plot_w
        y = margin + (node["lat"] - min_lat) / (max_lat - min_lat) * plot_h
        return x, y

    def draw_path(self, path, color, width, dash=None):
        c = self.canv
        nodes = node_lookup(self.dataset)
        c.setStrokeColor(color)
        c.setLineWidth(width)
        c.setDash(dash or [])
        for start, end in zip(path, path[1:]):
            x1, y1 = self.point_for(nodes[start])
            x2, y2 = self.point_for(nodes[end])
            c.line(x1, y1, x2, y2)
        c.setDash([])

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["paper"])
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=0)
        nodes = node_lookup(self.dataset)

        c.setStrokeColor(PALETTE["line"])
        c.setLineWidth(0.8)
        for edge in self.dataset["edges"]:
            x1, y1 = self.point_for(nodes[edge["from"]])
            x2, y2 = self.point_for(nodes[edge["to"]])
            c.line(x1, y1, x2, y2)
            c.setFillColor(PALETTE["muted"])
            c.setFont(FONT_REGULAR, 6.4)
            c.drawString((x1 + x2) / 2 + 2, (y1 + y2) / 2 + 2, str(edge["weight"]))

        self.draw_path(self.dijkstra_path, PALETTE["blue"], 3.0)
        self.draw_path(self.a_star_path, PALETTE["purple"], 2.3, [5, 3])

        source = self.dataset["defaultSource"]
        target = self.dataset["defaultTarget"]
        for node in self.dataset["nodes"]:
            x, y = self.point_for(node)
            fill = PALETTE["teal_light"] if node["id"] == source else PALETTE["purple_light"] if node["id"] == target else colors.white
            c.setFillColor(fill)
            c.setStrokeColor(PALETTE["ink"])
            c.circle(x, y, 8.5, fill=1, stroke=1)
            c.setFillColor(PALETTE["ink"])
            c.setFont(FONT_BOLD, 6.8)
            c.drawCentredString(x, y - 2.4, str(node["id"]))

        legend_x = self.width * 0.76
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_BOLD, 10)
        c.drawString(legend_x, self.height - 32, "Chú thích graph")
        c.setStrokeColor(PALETTE["line"])
        c.setLineWidth(1)
        c.line(legend_x, self.height - 54, legend_x + 42, self.height - 54)
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_REGULAR, 8)
        c.drawString(legend_x + 50, self.height - 58, "Cạnh trong graph")
        c.setStrokeColor(PALETTE["blue"])
        c.setLineWidth(3)
        c.line(legend_x, self.height - 76, legend_x + 42, self.height - 76)
        c.drawString(legend_x + 50, self.height - 80, "Dijkstra path")
        c.setStrokeColor(PALETTE["purple"])
        c.setLineWidth(2.3)
        c.setDash([5, 3])
        c.line(legend_x, self.height - 98, legend_x + 42, self.height - 98)
        c.setDash([])
        c.drawString(legend_x + 50, self.height - 102, "A* path")

        c.setFillColor(PALETTE["muted"])
        c.setFont(FONT_REGULAR, 7.1)
        labels = [f"{node['id']} {node['name']}" for node in self.dataset["nodes"]]
        for index, label in enumerate(labels):
            c.drawString(legend_x, self.height - 130 - index * 14, label[:30])
        c.restoreState()


class RelaxationFlow(Flowable):
    def __init__(self, width: float):
        super().__init__()
        self.width = width
        self.height = 104

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["blue_light"])
        c.setStrokeColor(PALETTE["blue"])
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=1)
        steps = [
            ("1", "Pick min", "Lấy node có distance nhỏ nhất"),
            ("2", "Relax", "Cập nhật cạnh đi ra nếu tốt hơn"),
            ("3", "Queue", "Đưa distance mới vào priority queue"),
            ("4", "Stop", "Dừng khi lấy target ra khỏi queue"),
        ]
        gap = 12
        box_w = (self.width - 36 - gap * 3) / 4
        for index, (number, title, body) in enumerate(steps):
            x = 18 + index * (box_w + gap)
            c.setFillColor(colors.white)
            c.setStrokeColor(PALETTE["blue"])
            c.roundRect(x, 24, box_w, 52, 8, fill=1, stroke=1)
            c.setFillColor(PALETTE["blue"])
            c.circle(x + 15, 58, 8, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont(FONT_BOLD, 7)
            c.drawCentredString(x + 15, 55.5, number)
            c.setFillColor(PALETTE["ink"])
            c.setFont(FONT_BOLD, 8)
            c.drawString(x + 28, 58, title)
            c.setFillColor(PALETTE["muted"])
            c.setFont(FONT_REGULAR, 6.8)
            c.drawString(x + 10, 39, body[:34])
        c.restoreState()


class AStarFormula(Flowable):
    def __init__(self, width: float):
        super().__init__()
        self.width = width
        self.height = 96

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALETTE["purple_light"])
        c.setStrokeColor(PALETTE["purple"])
        c.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=1)
        c.setFillColor(PALETTE["ink"])
        c.setFont(FONT_BOLD, 12)
        c.drawString(18, 66, "A* priority")
        c.setFont(FONT_BOLD, 16)
        c.setFillColor(PALETTE["purple"])
        c.drawString(18, 39, "f(n) = g(n) + h(n)")
        c.setFillColor(PALETTE["muted"])
        c.setFont(FONT_REGULAR, 8)
        c.drawString(190, 48, "g(n): chi phí từ source đến n")
        c.drawString(190, 32, "h(n): ước lượng từ n đến target bằng tọa độ")
        c.drawString(18, 15, "Nếu heuristic không vượt quá chi phí thật còn lại, A* vẫn tìm được shortest path.")
        c.restoreState()


def callout(title: str, body: str, color=PALETTE["teal"], fill=PALETTE["teal_light"]) -> Table:
    data = [[p(f"<b>{escape(title)}</b><br/>{escape(body)}", "Callout")]]
    table = Table(data, colWidths=[16.8 * cm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.8, color),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def scaled_image(path: Path, max_width: float, max_height: float) -> Image | None:
    if not path.exists():
        return None
    image = Image(str(path))
    ratio = min(max_width / image.imageWidth, max_height / image.imageHeight)
    image.drawWidth = image.imageWidth * ratio
    image.drawHeight = image.imageHeight * ratio
    image.hAlign = "CENTER"
    return image


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(PALETTE["line"])
    canvas.setLineWidth(0.4)
    canvas.line(doc.leftMargin, A4[1] - 1.25 * cm, A4[0] - doc.rightMargin, A4[1] - 1.25 * cm)
    canvas.setFont(FONT_REGULAR, 7.8)
    canvas.setFillColor(PALETTE["muted"])
    canvas.drawString(doc.leftMargin, A4[1] - 0.95 * cm, "RouteLab Group 1 · Shortest Path Dijkstra + A*")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.75 * cm, f"Trang {doc.page}")
    canvas.restoreState()


def trace_rows(dataset: dict, result: PathResult, limit: int = 9) -> list[list[str]]:
    rows = [["Bước", "Sự kiện", "Cạnh", "Cost tích lũy"]]
    for index, edge in enumerate(result.relaxed_edges[:limit], start=1):
        rows.append(
            [
                str(index),
                "Relax edge",
                f"{edge['from']} → {edge['to']}",
                f"{edge['cumulativeCost']:g}",
            ]
        )
    if len(result.relaxed_edges) > limit:
        rows.append(["...", f"Còn {len(result.relaxed_edges) - limit} relaxation", "...", "..."])
    rows.append(["Done", f"Visited: {short_path(result.visited_order)}", f"Path: {short_path(result.path)}", f"{result.total_cost:g}"])
    return rows


def build_report() -> None:
    dataset = load_dataset()
    source = dataset["defaultSource"]
    target = dataset["defaultTarget"]
    dijkstra = solve_dijkstra(dataset, source, target)
    a_star = solve_a_star(dataset, source, target)

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=1.45 * cm,
        rightMargin=1.45 * cm,
        topMargin=1.65 * cm,
        bottomMargin=1.35 * cm,
        title="RouteLab Group 1 - Shortest Path Report",
        author="RouteLab Group 1",
    )

    story = []
    logo = scaled_image(LOGO_PATH, 7.6 * cm, 1.6 * cm)
    if logo:
        story.append(logo)
        story.append(Spacer(1, 0.55 * cm))
    story.append(CoverBand(16.8 * cm, 6.1 * cm))
    story.append(Spacer(1, 0.65 * cm))
    story.append(p("BÁO CÁO DỰ ÁN", "Subtitle"))
    story.append(p("RouteLab Group 1", "CoverTitle"))
    story.append(
        p(
            "Mô phỏng tìm đường ngắn nhất trên bản đồ bằng Dijkstra và A*. Ứng dụng dùng graph có trọng số, chọn một điểm nguồn và một điểm đích, sau đó so sánh path, tổng chi phí, node đã duyệt và runtime.",
            "Subtitle",
        )
    )
    story.append(
        make_table(
            [
                ["Hạng mục", "Nội dung"],
                ["Môn học", "Phân tích thiết kế giải thuật"],
                ["Tech stack", "React + Vite · Node.js + Express · Leaflet/OpenStreetMap · JSON graph"],
                ["Demo scope", "Graph 5-10 điểm, trọng số không âm, tìm đường từ source đến target"],
                ["Dataset chính", f"{dataset['name']} ({len(dataset['nodes'])} nodes, {len(dataset['edges'])} edges)"],
                ["Domain frontend", "maps.hailamdev.space"],
            ],
            col_widths=[4.2 * cm, 12.4 * cm],
            font_size=9,
        )
    )
    story.append(PageBreak())

    story.append(p("1. Tổng Quan Dự Án", "H1"))
    story.append(
        callout(
            "Mục tiêu sản phẩm",
            "RouteLab giúp trực quan hóa cách hai thuật toán shortest path tìm đường từ nguồn đến đích trên một graph bản đồ đơn giản. Đây là mô phỏng học thuật, không phải bản sao đầy đủ của Google Maps.",
        )
    )
    story.extend(
        bullet_items(
            [
                "Input chính là graph gồm nodes, edges, trọng số cạnh, source và target.",
                "Dijkstra bảo đảm shortest path với trọng số không âm bằng relaxation và priority queue.",
                "A* dùng thêm heuristic theo tọa độ để ưu tiên node có vẻ gần đích hơn.",
                "Frontend gọi backend Render thật để lấy dataset và chạy Dijkstra/A*; mock local chỉ là fallback khi backend tạm thời chậm.",
            ]
        )
    )
    story.append(p("Kiến trúc tổng quan", "H2"))
    story.append(ArchitectureDiagram(16.8 * cm))
    story.append(p("Hình 1. Luồng dữ liệu từ UI sang API, solver, graph data và tài liệu kiểm thử.", "Caption"))

    story.append(p("2. Mô Hình Dữ Liệu Và API", "H1"))
    story.append(
        p(
            "Dataset demo dùng graph có trọng số. Mỗi cạnh biểu diễn một đoạn đường có thể đi giữa hai địa điểm; trọng số là chi phí mô phỏng như khoảng cách hoặc thời gian.",
            "Body",
        )
    )
    node_rows = [["ID", "Node", "Lat", "Lng", "Vai trò"]]
    for node in dataset["nodes"]:
        role = "Source" if node["id"] == source else "Target" if node["id"] == target else "Trung gian"
        node_rows.append([str(node["id"]), node["name"], f"{node['lat']:.4f}", f"{node['lng']:.4f}", role])
    story.append(make_table(node_rows, col_widths=[1.0 * cm, 6.6 * cm, 3.2 * cm, 3.2 * cm, 2.6 * cm], alignments={0: "CENTER"}))
    story.append(Spacer(1, 0.2 * cm))
    api_rows = [
        ["Endpoint", "Vai trò", "Kết quả chính"],
        ["GET /api/datasets", "Liệt kê graph demo", "id, name, nodeCount, edgeCount"],
        ["GET /api/datasets/:id", "Lấy full dataset", "nodes, edges, directed, defaultSource, defaultTarget"],
        ["POST /api/solve/dijkstra", "Chạy Dijkstra", "path, totalCost, runtimeMs, visitedOrder, relaxedEdges"],
        ["POST /api/solve/a-star", "Chạy A*", "path, totalCost, runtimeMs, visitedOrder, relaxedEdges"],
    ]
    story.append(p("API contract", "H2"))
    story.append(make_table(api_rows, col_widths=[4.7 * cm, 5.8 * cm, 6.1 * cm], font_size=8.2))
    story.append(PageBreak())

    story.append(p("3. Thuật Toán Dijkstra", "H1"))
    story.append(
        p(
            "Dijkstra duy trì khoảng cách tốt nhất tạm thời từ source đến từng node. Ở mỗi vòng, thuật toán lấy node có distance nhỏ nhất ra khỏi priority queue rồi relax tất cả cạnh đi ra từ node đó.",
            "Body",
        )
    )
    story.append(RelaxationFlow(16.8 * cm))
    story.append(code_block("""
dist[source] = 0
priorityQueue.push(source, 0)

while queue is not empty:
    current = pop node with smallest dist
    if current == target: stop

    for each edge current -> neighbor:
        nextCost = dist[current] + edge.weight
        if nextCost < dist[neighbor]:
            dist[neighbor] = nextCost
            previous[neighbor] = current
            queue.push(neighbor, nextCost)

return path reconstructed from previous[target]
"""))
    story.append(
        make_table(
            [
                ["Tiêu chí", "Phân tích"],
                ["Điều kiện đúng", "Tất cả edge weight không âm."],
                ["Cấu trúc dữ liệu", "Priority queue/min-heap cho node có distance nhỏ nhất."],
                ["Độ phức tạp", "O((V + E) log V) nếu dùng binary heap."],
                ["Ưu điểm", "Chắc chắn tìm shortest path, dễ giải thích bằng relaxation."],
                ["Hạn chế", "Có thể duyệt nhiều node không hướng về target vì không dùng thông tin vị trí đích."],
            ],
            col_widths=[4.0 * cm, 12.6 * cm],
            font_size=8.5,
        )
    )

    story.append(p("4. Thuật Toán A*", "H1"))
    story.append(
        p(
            "A* mở rộng Dijkstra bằng cách cộng thêm heuristic h(n), tức ước lượng chi phí từ node hiện tại đến target. Nhờ đó thuật toán ưu tiên các node có tổng f(n) nhỏ hơn.",
            "Body",
        )
    )
    story.append(AStarFormula(16.8 * cm))
    story.append(code_block("""
g[source] = 0
f[source] = heuristic(source, target)
priorityQueue.push(source, f[source])

while queue is not empty:
    current = pop node with smallest f
    if current == target: stop

    for each edge current -> neighbor:
        tentativeG = g[current] + edge.weight
        if tentativeG < g[neighbor]:
            previous[neighbor] = current
            g[neighbor] = tentativeG
            f[neighbor] = g[neighbor] + heuristic(neighbor, target)
            queue.push(neighbor, f[neighbor])
"""))
    story.append(
        make_table(
            [
                ["Tiêu chí", "Phân tích"],
                ["g(n)", "Chi phí tốt nhất đã biết từ source đến node n."],
                ["h(n)", "Ước lượng còn lại từ n đến target; demo dùng khoảng cách tọa độ đã scale bảo thủ."],
                ["f(n)", "Độ ưu tiên trong queue: f(n) = g(n) + h(n)."],
                ["Tính tối ưu", "Được giữ nếu heuristic admissible, tức không ước lượng vượt chi phí thật."],
                ["Kỳ vọng", "Thường duyệt ít node hơn Dijkstra khi heuristic định hướng tốt."],
            ],
            col_widths=[4.0 * cm, 12.6 * cm],
            font_size=8.5,
        )
    )
    story.append(PageBreak())

    story.append(p("5. Kết Quả Thực Nghiệm", "H1"))
    story.append(
        p(
            f"Demo chạy từ source {source} ({node_name(dataset, source)}) đến target {target} ({node_name(dataset, target)}). Runtime chỉ mang tính tham khảo vì phụ thuộc máy chạy và kích thước input.",
            "Body",
        )
    )
    story.append(GraphMap(dataset, dijkstra.path, a_star.path, 16.8 * cm))
    story.append(p("Hình 2. Graph demo tại TP.HCM: cạnh xám là graph, xanh là Dijkstra path, tím nét đứt là A* path.", "Caption"))
    result_rows = [
        ["Thuật toán", "Path", "Total cost", "Visited nodes", "Runtime tham khảo"],
        ["Dijkstra", short_path(dijkstra.path), f"{dijkstra.total_cost:g}", short_path(dijkstra.visited_order), f"{dijkstra.runtime_ms:.3f} ms"],
        ["A*", short_path(a_star.path), f"{a_star.total_cost:g}", short_path(a_star.visited_order), f"{a_star.runtime_ms:.3f} ms"],
    ]
    story.append(make_table(result_rows, col_widths=[3.0 * cm, 3.4 * cm, 2.3 * cm, 5.1 * cm, 2.8 * cm], font_size=7.9))
    story.append(
        callout(
            "Nhận xét demo",
            f"Cả hai thuật toán tìm path {short_path(dijkstra.path)} với tổng chi phí {dijkstra.total_cost:g}. Dijkstra là baseline chắc chắn; A* cho cách giải thích trực quan hơn vì có heuristic hướng về đích.",
            PALETTE["blue"],
            PALETTE["blue_light"],
        )
    )
    story.append(p("Trace relaxation rút gọn", "H2"))
    story.append(make_table(trace_rows(dataset, dijkstra), col_widths=[1.5 * cm, 5.0 * cm, 4.0 * cm, 3.0 * cm], font_size=7.8))

    story.append(p("6. So Sánh Tổng Hợp", "H1"))
    compare_rows = [
        ["Tiêu chí", "Dijkstra", "A*"],
        ["Mục tiêu", "Tìm shortest path bằng distance hiện tại nhỏ nhất.", "Tìm shortest path bằng distance + heuristic đến đích."],
        ["Bảo đảm tối ưu", "Có nếu trọng số không âm.", "Có nếu heuristic admissible/consistent."],
        ["Thông tin dùng thêm", "Không dùng vị trí target để ưu tiên.", "Dùng h(n), ví dụ khoảng cách tọa độ tới target."],
        ["Độ phức tạp", "O((V + E) log V).", "Worst-case tương tự Dijkstra, thực tế có thể duyệt ít hơn."],
        ["Phù hợp demo", "Giải thích relaxation rõ ràng.", "Giải thích mô phỏng bản đồ trực quan hơn."],
        ["Vai trò trong app", "Baseline chuẩn để đối chiếu.", "Phiên bản định hướng đích để so sánh số node đã duyệt."],
    ]
    story.append(make_table(compare_rows, col_widths=[3.5 * cm, 6.55 * cm, 6.55 * cm], font_size=8.1))
    story.append(p("Danh sách cạnh demo", "H2"))
    edge_rows = [["Edge", "From", "To", "Weight", "Label"]]
    for edge in dataset["edges"]:
        edge_rows.append([edge["id"], str(edge["from"]), str(edge["to"]), f"{edge['weight']:g}", edge.get("label", "")])
    story.append(make_table(edge_rows, col_widths=[2.1 * cm, 1.4 * cm, 1.4 * cm, 1.8 * cm, 9.9 * cm], font_size=7.4))
    story.append(PageBreak())

    story.append(p("7. Kiểm Thử, CI/CD Và Hướng Phát Triển", "H1"))
    story.extend(
        bullet_items(
            [
                "Backend có test cho health endpoint, dataset graph endpoint, validator graph, Dijkstra, A*, priority queue, heuristic và solve endpoints.",
                "Frontend có test cho API config, dataset client, solver client, validation, path cost, playback state và comparison table.",
                "CI backend nên chặn deploy nếu typecheck/test/build lỗi hoặc AI review phát hiện lỗi nghiêm trọng.",
                "Frontend deploy trên Vercel tại maps.hailamdev.space; backend deploy trên Render tại routelab-backend.onrender.com.",
            ]
        )
    )
    story.append(p("Hướng phát triển sau migration", "H2"))
    roadmap_rows = [
        ["Hạng mục", "Đề xuất cải thiện"],
        ["Backend", "Lưu thêm lịch sử solve runs, thống kê runtime và dataset version để phục vụ báo cáo thực nghiệm."],
        ["Visualization", "Thêm traffic/blocked road toggle để thay đổi trọng số cạnh và chứng minh path đổi theo điều kiện đường đi."],
        ["Data", "Tạo dataset có nhiều ngã rẽ để A* duyệt ít node hơn Dijkstra rõ ràng."],
        ["Demo", "Chụp lại screenshot production sau deploy cuối và luyện kịch bản 3-5 phút."],
        ["Report/slide", "Đưa graph map, trace relaxation và bảng so sánh backend thật vào slide cuối kỳ."],
    ]
    story.append(make_table(roadmap_rows, col_widths=[4.2 * cm, 12.4 * cm], font_size=8.4))
    screenshot = scaled_image(DASHBOARD_SCREENSHOT, 15.6 * cm, 7.8 * cm)
    if screenshot:
        story.append(Spacer(1, 0.25 * cm))
        story.append(p("Giao diện demo", "H2"))
        story.append(screenshot)
        story.append(p("Hình 3. Dashboard dùng để chọn dataset, source, target, chạy thuật toán và xem playback.", "Caption"))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    build_report()
    print(OUTPUT_PATH)
