import type { GraphEdge, GraphNode, PathSolveRequest, ValidationIssue } from "../types/path.js";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isGraphNode(value: unknown): value is GraphNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Partial<GraphNode>;
  return (
    Number.isInteger(node.id) &&
    typeof node.name === "string" &&
    node.name.length > 0 &&
    isFiniteNumber(node.lat) &&
    isFiniteNumber(node.lng)
  );
}

function isGraphEdge(value: unknown): value is GraphEdge {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const edge = value as Partial<GraphEdge>;
  const hasValidGeometry =
    edge.geometry === undefined ||
    (Array.isArray(edge.geometry) &&
      edge.geometry.length >= 2 &&
      edge.geometry.every((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng)));

  return (
    typeof edge.id === "string" &&
    edge.id.length > 0 &&
    Number.isInteger(edge.from) &&
    Number.isInteger(edge.to) &&
    isFiniteNumber(edge.weight) &&
    //edge.weight >= 0 &&
    (edge.label === undefined || typeof edge.label === "string") &&
    hasValidGeometry
  );
}

export function validateSolveRequest(request: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof request !== "object" || request === null) {
    return [
      {
        code: "request-invalid",
        message: "Request body must be a JSON object."
      }
    ];
  }

  const { source, target, nodes, edges } = request as Partial<PathSolveRequest>;

  if (!Array.isArray(nodes) || nodes.length === 0) {
    issues.push({
      code: "nodes-empty",
      message: "Nodes must be a non-empty array."
    });
  } else if (!nodes.every(isGraphNode)) {
    issues.push({
      code: "node-invalid",
      message: "Each node must include integer id, name, lat, and lng."
    });
  }

  if (!Array.isArray(edges) || edges.length === 0) {
    issues.push({
      code: "edges-empty",
      message: "Edges must be a non-empty array."
    });
  } else if (!edges.every(isGraphEdge)) {
    issues.push({
      code: "edge-invalid",
      message: "Each edge must include id, from, to, non-negative weight, and optional valid geometry."
    });
  }

  const nodeIds = new Set((Array.isArray(nodes) ? nodes : []).filter(isGraphNode).map((node) => node.id));
  if (Array.isArray(nodes) && nodeIds.size !== nodes.length) {
    issues.push({
      code: "node-ids-duplicate",
      message: "Node ids must be unique."
    });
  }

  if (typeof source !== "number" || !Number.isInteger(source)) {
    issues.push({
      code: "source-not-integer",
      message: "Source node id must be an integer."
    });
  } else if (!nodeIds.has(source)) {
    issues.push({
      code: "source-not-found",
      message: "Source node id must exist in nodes."
    });
  }

  if (typeof target !== "number" || !Number.isInteger(target)) {
    issues.push({
      code: "target-not-integer",
      message: "Target node id must be an integer."
    });
  } else if (!nodeIds.has(target)) {
    issues.push({
      code: "target-not-found",
      message: "Target node id must exist in nodes."
    });
  }

  if (Number.isInteger(source) && Number.isInteger(target) && source === target) {
    issues.push({
      code: "source-target-same",
      message: "Source and target must be different nodes for the demo."
    });
  }

  if (Array.isArray(edges)) {
    for (const edge of edges.filter(isGraphEdge)) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        issues.push({
          code: "edge-node-not-found",
          message: `Edge ${edge.id} must reference existing nodes.`
        });
      }
    }
  }

  return issues;
}
