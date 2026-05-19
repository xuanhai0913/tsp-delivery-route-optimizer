import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ValidationIssue } from "../types/tsp";

type ValidationMessageProps = {
  issues: ValidationIssue[];
};

export function ValidationMessage({ issues }: ValidationMessageProps) {
  if (issues.length === 0) {
    return (
      <div className="validation-box success">
        <CheckCircle2 size={20} />
        <span>Dữ liệu hợp lệ. Có thể chạy thuật toán.</span>
      </div>
    );
  }

  return (
    <div className="validation-box error">
      <AlertTriangle size={22} />
      <div>
        <strong>Cảnh báo dữ liệu</strong>
        <ul>
          {issues.map((issue) => (
            <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
