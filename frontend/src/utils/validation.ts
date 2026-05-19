import type { Dataset, SolveRequest, ValidationIssue } from "../types/tsp";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateSolveRequest(request: SolveRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { start, costMatrix } = request;

  if (!Number.isInteger(start)) {
    issues.push({
      code: "start-not-integer",
      message: "Điểm xuất phát phải là số nguyên.",
      severity: "error",
    });
  }

  if (costMatrix.length === 0) {
    issues.push({
      code: "matrix-empty",
      message: "Ma trận chi phí không được rỗng.",
      severity: "error",
    });
    return issues;
  }

  if (start < 0 || start >= costMatrix.length) {
    issues.push({
      code: "start-out-of-range",
      message: "Điểm xuất phát không hợp lệ với kích thước ma trận.",
      severity: "error",
    });
  }

  const expectedSize = costMatrix.length;
  for (let rowIndex = 0; rowIndex < costMatrix.length; rowIndex += 1) {
    const row = costMatrix[rowIndex];

    if (!Array.isArray(row) || row.length !== expectedSize) {
      issues.push({
        code: "matrix-not-square",
        message: "Ma trận phải là ma trận vuông.",
        severity: "error",
      });
      break;
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const value = row[columnIndex];
      if (!isFiniteNumber(value)) {
        issues.push({
          code: "matrix-non-number",
          message: `Chi phí tại ô (${rowIndex},${columnIndex}) phải là số.`,
          severity: "error",
        });
      } else if (value < 0) {
        issues.push({
          code: "matrix-negative",
          message: `Chi phí tại ô (${rowIndex},${columnIndex}) phải là số không âm.`,
          severity: "error",
        });
      }
    }
  }

  return issues;
}

export function validateDataset(dataset: Dataset, start: number): ValidationIssue[] {
  const requestIssues = validateSolveRequest({ start, costMatrix: dataset.costMatrix });
  const issues: ValidationIssue[] = [...requestIssues];

  if (dataset.locations.length !== dataset.costMatrix.length) {
    issues.push({
      code: "locations-matrix-mismatch",
      message: "Số lượng địa điểm phải khớp với kích thước ma trận.",
      severity: "error",
    });
  }

  const ids = new Set(dataset.locations.map((location) => location.id));
  if (ids.size !== dataset.locations.length) {
    issues.push({
      code: "duplicate-location-id",
      message: "ID địa điểm không được trùng nhau.",
      severity: "error",
    });
  }

  if (dataset.locations.length > 10) {
    issues.push({
      code: "demo-size-warning",
      message: "Demo nên giữ trong khoảng 5-10 điểm để Branch and Bound chạy mượt.",
      severity: "warning",
    });
  }

  return issues;
}

export function hasBlockingIssue(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
