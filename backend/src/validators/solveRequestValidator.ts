import type { SolveRequest, ValidationIssue } from "../types/tsp.js";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateSolveRequest(request: SolveRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { start, costMatrix } = request;

  if (!Number.isInteger(start)) {
    issues.push({
      code: "start-not-integer",
      message: "Start index must be an integer."
    });
  }

  if (!Array.isArray(costMatrix) || costMatrix.length === 0) {
    issues.push({
      code: "matrix-empty",
      message: "Cost matrix must be a non-empty square matrix."
    });
    return issues;
  }

  if (start < 0 || start >= costMatrix.length) {
    issues.push({
      code: "start-out-of-range",
      message: "Start index must be inside the matrix range."
    });
  }

  const matrixSize = costMatrix.length;
  for (let rowIndex = 0; rowIndex < matrixSize; rowIndex += 1) {
    const row = costMatrix[rowIndex];

    if (!Array.isArray(row) || row.length !== matrixSize) {
      issues.push({
        code: "matrix-not-square",
        message: "Cost matrix must be square."
      });
      break;
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const value = row[columnIndex];

      if (!isFiniteNumber(value)) {
        issues.push({
          code: "matrix-non-number",
          message: `Cost at (${rowIndex}, ${columnIndex}) must be a finite number.`
        });
      } else if (value < 0) {
        issues.push({
          code: "matrix-negative",
          message: `Cost at (${rowIndex}, ${columnIndex}) must be non-negative.`
        });
      }
    }
  }

  return issues;
}
