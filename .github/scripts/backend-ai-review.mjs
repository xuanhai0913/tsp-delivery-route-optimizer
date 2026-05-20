import { readFile, writeFile } from "node:fs/promises";

const diffPath = process.env.REVIEW_DIFF_PATH ?? ".github/backend.diff";
const resultPath = process.env.AI_REVIEW_RESULT_PATH ?? ".github/ai-review-result.json";
const summaryPath = process.env.AI_REVIEW_SUMMARY_PATH ?? ".github/ai-review-summary.md";
const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;

function asIssueArray(value) {
  return Array.isArray(value)
    ? value.map((issue) => ({
        file: String(issue.file ?? "unknown"),
        line: issue.line === null || issue.line === undefined ? null : Number(issue.line),
        title: String(issue.title ?? "Phát hiện khi review"),
        detail: String(issue.detail ?? ""),
        recommendation: String(issue.recommendation ?? "")
      }))
    : [];
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Phản hồi AI không chứa JSON object hợp lệ.");
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function toMarkdownList(issues) {
  if (issues.length === 0) {
    return "- Không có";
  }

  return issues
    .map((issue) => {
      const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      const recommendation = issue.recommendation ? `\n  - Gợi ý sửa: ${issue.recommendation}` : "";
      return `- **${issue.title}** (${location})\n  - ${issue.detail}${recommendation}`;
    })
    .join("\n");
}

async function writeReviewFiles(review, gate) {
  const result = {
    ...review,
    gate
  };

  const markdown = [
    "# AI Review Backend",
    "",
    `Trạng thái: **${gate.passed ? "đạt" : "không đạt"}**`,
    `Lỗi nghiêm trọng: **${review.critical.length}**`,
    `Cảnh báo: **${review.warnings.length}**`,
    "",
    "## Tóm tắt",
    review.summary || "Không có tóm tắt.",
    "",
    "## Lỗi nghiêm trọng",
    toMarkdownList(review.critical),
    "",
    "## Cảnh báo",
    toMarkdownList(review.warnings),
    ""
  ].join("\n");

  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(summaryPath, markdown);
}

async function main() {
  if (!apiKey) {
    const review = {
      summary: "Chưa cấu hình GEMINI_API_KEY nên không thể chạy AI review cho backend.",
      critical: [
        {
          file: ".github/workflows/backend-algorithm-ci.yml",
          line: null,
          title: "Thiếu secret GEMINI_API_KEY",
          detail: "Cần thêm GEMINI_API_KEY vào GitHub Actions secrets trước khi cho phép deploy backend.",
          recommendation: "Vào Repository Settings > Secrets and variables > Actions > New repository secret."
        }
      ],
      warnings: []
    };
    await writeReviewFiles(review, { passed: false, reason: "missing-secret" });
    process.exit(1);
  }

  const diff = await readFile(diffPath, "utf8").catch(() => "");

  if (!diff.trim()) {
    await writeReviewFiles(
      {
        summary: "Không phát hiện thay đổi backend hoặc data cần review.",
        critical: [],
        warnings: []
      },
      { passed: true, reason: "empty-diff" }
    );
    return;
  }

  const prompt = [
    "Bạn là senior backend reviewer nghiêm khắc cho dự án Node.js + Express + TypeScript tối ưu lộ trình TSP.",
    "Hãy review git diff bên dưới và chỉ báo lỗi thật: sai thuật toán, crash runtime, lộ secret, dùng database sai, blocker deploy, vỡ API contract, hoặc thiếu test cho thay đổi rủi ro.",
    "Không báo lỗi về style, format, đặt tên, hoặc refactor vô hại.",
    "Chỉ phân loại critical nếu lỗi có thể làm hỏng production, lộ secret, mất/sai dữ liệu, fail deploy, hoặc tạo kết quả thuật toán sai rõ ràng.",
    "Toàn bộ nội dung trong summary, title, detail, recommendation phải viết bằng tiếng Việt ngắn gọn, dễ hiểu cho sinh viên trong team.",
    "Trả về strict JSON duy nhất theo shape này, không thêm markdown:",
    '{"summary":"string","critical":[{"file":"string","line":number|null,"title":"string","detail":"string","recommendation":"string"}],"warnings":[{"file":"string","line":number|null,"title":"string","detail":"string","recommendation":"string"}]}',
    "",
    "Git diff:",
    diff.slice(0, 120_000)
  ].join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gọi Gemini API thất bại với status ${response.status}: ${detail.slice(0, 500)}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") ?? "";
  const parsed = extractJson(text);
  const review = {
    summary: String(parsed.summary ?? "AI review backend đã hoàn tất."),
    critical: asIssueArray(parsed.critical),
    warnings: asIssueArray(parsed.warnings)
  };
  const gate = {
    passed: review.critical.length === 0 && review.warnings.length <= 5,
    reason: review.critical.length > 0 ? "critical-findings" : review.warnings.length > 5 ? "warning-threshold" : "passed"
  };

  await writeReviewFiles(review, gate);

  if (!gate.passed) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  const review = {
    summary: "AI review backend không chạy xong.",
    critical: [
      {
        file: ".github/scripts/backend-ai-review.mjs",
        line: null,
        title: "Lỗi khi chạy AI review",
        detail: error instanceof Error ? error.message : String(error),
        recommendation: "Kiểm tra GEMINI_API_KEY, model Gemini, và network của GitHub Actions."
      }
    ],
    warnings: []
  };

  await writeReviewFiles(review, { passed: false, reason: "review-execution-failed" });
  process.exit(1);
});
