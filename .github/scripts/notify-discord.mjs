import { readFile } from "node:fs/promises";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  process.exit(0);
}

const summaryPath = process.env.AI_REVIEW_SUMMARY_PATH ?? ".github/ai-review-summary.md";
const resultPath = process.env.AI_REVIEW_RESULT_PATH ?? ".github/ai-review-result.json";
const exitCode = process.env.AI_REVIEW_EXIT_CODE ?? "1";
const passed = exitCode === "0";
const mention = process.env.DISCORD_MENTION?.trim();
const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const commitUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`;
const summary = await readFile(summaryPath, "utf8").catch(() => "No AI review summary was generated.");
const reviewResult = await readFile(resultPath, "utf8")
  .then((content) => JSON.parse(content))
  .catch(() => null);

function truncate(text, maxLength) {
  if (!text) {
    return "Không có tóm tắt.";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function compactIssue(issue, index) {
  const location = issue?.line ? `${issue.file}:${issue.line}` : issue?.file;
  const title = issue?.title ?? "Vấn đề cần xem";

  return `${index + 1}. **${truncate(title, 90)}**${location ? ` (${location})` : ""}`;
}

function buildDescription() {
  if (!reviewResult) {
    return truncate(summary.replaceAll("#", "").trim(), 900);
  }

  const critical = Array.isArray(reviewResult.critical) ? reviewResult.critical : [];
  const warnings = Array.isArray(reviewResult.warnings) ? reviewResult.warnings : [];
  const topIssues = [...critical, ...warnings].slice(0, 3);
  const lines = [
    passed ? "Backend AI review đã đạt." : "Backend AI review chưa đạt, cần xem lại trước khi deploy.",
    `**Tóm tắt:** ${truncate(reviewResult.summary, 520)}`
  ];

  if (topIssues.length > 0) {
    lines.push(`**Vấn đề nổi bật:**\n${topIssues.map(compactIssue).join("\n")}`);
  }

  lines.push(`[Xem chi tiết trong GitHub Actions](${runUrl})`);

  return truncate(lines.join("\n\n"), 1400);
}

const criticalCount = Array.isArray(reviewResult?.critical) ? reviewResult.critical.length : "N/A";
const warningCount = Array.isArray(reviewResult?.warnings) ? reviewResult.warnings.length : "N/A";

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "RouteLab CI",
    content: !passed && mention ? `${mention} Backend AI review chưa đạt.` : undefined,
    embeds: [
      {
        title: passed ? "AI Review Backend Đạt" : "AI Review Backend Cần Xử Lý",
        description: buildDescription(),
        color: passed ? 0x00796b : 0xba1a1a,
        fields: [
          {
            name: "Critical",
            value: String(criticalCount),
            inline: true
          },
          {
            name: "Warnings",
            value: String(warningCount),
            inline: true
          },
          {
            name: "Người chạy",
            value: process.env.GITHUB_ACTOR ?? "unknown",
            inline: true
          },
          {
            name: "Commit",
            value: `[${(process.env.GITHUB_SHA ?? "").slice(0, 7)}](${commitUrl})`,
            inline: true
          },
          {
            name: "Workflow",
            value: `[Mở run](${runUrl})`,
            inline: true
          }
        ]
      }
    ]
  })
});

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Discord notification failed with ${response.status}: ${detail.slice(0, 500)}`);
}
