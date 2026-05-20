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
        title: String(issue.title ?? "Review finding"),
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
    throw new Error("AI response did not contain a JSON object.");
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function toMarkdownList(issues) {
  if (issues.length === 0) {
    return "- None";
  }

  return issues
    .map((issue) => {
      const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      const recommendation = issue.recommendation ? `\n  - Fix: ${issue.recommendation}` : "";
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
    "# Backend AI Review",
    "",
    `Status: **${gate.passed ? "passed" : "failed"}**`,
    `Critical findings: **${review.critical.length}**`,
    `Warnings: **${review.warnings.length}**`,
    "",
    "## Summary",
    review.summary || "No summary provided.",
    "",
    "## Critical",
    toMarkdownList(review.critical),
    "",
    "## Warnings",
    toMarkdownList(review.warnings),
    ""
  ].join("\n");

  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(summaryPath, markdown);
}

async function main() {
  if (!apiKey) {
    const review = {
      summary: "GEMINI_API_KEY is not configured, so the backend AI review cannot run.",
      critical: [
        {
          file: ".github/workflows/backend-algorithm-ci.yml",
          line: null,
          title: "Missing GEMINI_API_KEY secret",
          detail: "Add GEMINI_API_KEY as a GitHub Actions secret before allowing backend deploys.",
          recommendation: "Repository Settings > Secrets and variables > Actions > New repository secret."
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
        summary: "No backend or data diff was detected for review.",
        critical: [],
        warnings: []
      },
      { passed: true, reason: "empty-diff" }
    );
    return;
  }

  const prompt = [
    "You are a strict senior backend reviewer for a Node.js + Express + TypeScript TSP route optimizer.",
    "Review the provided git diff for real bugs only: algorithm correctness, runtime crashes, security leaks, database misuse, deploy blockers, broken API contracts, and missing tests for risky behavior.",
    "Do not report style preferences, formatting, naming, or harmless refactors.",
    "Classify as critical only if it can break production, expose secrets, corrupt data, make deploy fail, or produce clearly wrong algorithm results.",
    "Return strict JSON only with this shape:",
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
    throw new Error(`Gemini API request failed with ${response.status}: ${detail.slice(0, 500)}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") ?? "";
  const parsed = extractJson(text);
  const review = {
    summary: String(parsed.summary ?? "Backend AI review completed."),
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
    summary: "Backend AI review failed to complete.",
    critical: [
      {
        file: ".github/scripts/backend-ai-review.mjs",
        line: null,
        title: "AI review execution failed",
        detail: error instanceof Error ? error.message : String(error),
        recommendation: "Check GEMINI_API_KEY, model availability, and GitHub Actions network access."
      }
    ],
    warnings: []
  };

  await writeReviewFiles(review, { passed: false, reason: "review-execution-failed" });
  process.exit(1);
});
