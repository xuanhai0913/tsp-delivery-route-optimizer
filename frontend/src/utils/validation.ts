import type { Dataset, GraphEdge, GraphNode, SolveRequest, ValidationIssue } from "../types/path";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidNode(node: GraphNode): boolean {
  return (
    Number.isInteger(node.id) &&
    node.name.trim().length > 0 &&
    isFiniteNumber(node.lat) &&
    isFiniteNumber(node.lng)
  );
}

function isValidEdge(edge: GraphEdge): boolean {
  const hasValidGeometry =
    edge.geometry === undefined ||
    (edge.geometry.length >= 2 &&
      edge.geometry.every((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng)));

  return (
    edge.id.trim().length > 0 &&
    Number.isInteger(edge.from) &&
    Number.isInteger(edge.to) &&
    isFiniteNumber(edge.weight) &&
    edge.weight >= 0 &&
    hasValidGeometry
  );
}

export function validateSolveRequest(request: SolveRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { source, target, nodes, edges } = request;
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (!nodes.length) {
    issues.push({
      code: "nodes-empty",
      message: "Graph phải có ít nhất một node.",
      severity: "error",
    });
  }

  if (!edges.length) {
    issues.push({
      code: "edges-empty",
      message: "Graph phải có ít nhất một cạnh có trọng số.",
      severity: "error",
    });
  }

  if (!Number.isInteger(source) || !nodeIds.has(source)) {
    issues.push({
      code: "source-invalid",
      message: "Nguồn phải là ID node hợp lệ.",
      severity: "error",
    });
  }

  if (!Number.isInteger(target) || !nodeIds.has(target)) {
    issues.push({
      code: "target-invalid",
      message: "Đích phải là ID node hợp lệ.",
      severity: "error",
    });
  }

  if (source === target) {
    issues.push({
      code: "source-target-same",
      message: "Nguồn và đích nên khác nhau để demo shortest path rõ ràng.",
      severity: "error",
    });
  }

  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) {
    issues.push({
      code: "duplicate-node-id",
      message: "ID node không được trùng nhau.",
      severity: "error",
    });
  }

  for (const node of nodes) {
    if (!isValidNode(node)) {
      issues.push({
        code: "node-invalid",
        message: `Node ${node.id} cần name, lat, lng hợp lệ.`,
        severity: "error",
      });
    }
  }

  for (const edge of edges) {
    if (!isValidEdge(edge)) {
      issues.push({
        code: "edge-invalid",
        message: `Cạnh ${edge.id || "(không id)"} cần from, to, weight không âm và geometry hợp lệ nếu có.`,
        severity: "error",
      });
    } else if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      issues.push({
        code: "edge-node-missing",
        message: `Cạnh ${edge.id} phải nối giữa các node tồn tại.`,
        severity: "error",
      });
    }
  }

  return issues;
}

export function validateDataset(dataset: Dataset, source: number, target: number): ValidationIssue[] {
  const issues = validateSolveRequest({
    source,
    target,
    nodes: dataset.nodes,
    edges: dataset.edges,
    directed: dataset.directed,
  });

  if (dataset.nodes.length < 4) {
    issues.push({
      code: "demo-size-warning",
      message: "Demo nên có ít nhất 4 node để quá trình duyệt graph trực quan hơn.",
      severity: "warning",
    });
  }

  return issues;
}

export function hasBlockingIssue(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
