import { readFile } from "node:fs/promises";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  process.exit(0);
}

const summaryPath = process.env.AI_REVIEW_SUMMARY_PATH ?? ".github/ai-review-summary.md";
const exitCode = process.env.AI_REVIEW_EXIT_CODE ?? "1";
const passed = exitCode === "0";
const mention = process.env.DISCORD_MENTION?.trim();
const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const commitUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`;
const summary = await readFile(summaryPath, "utf8").catch(() => "No AI review summary was generated.");
const excerpt = summary.length > 3300 ? `${summary.slice(0, 3300)}\n...` : summary;

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "RouteLab CI",
    content: !passed && mention ? mention : undefined,
    embeds: [
      {
        title: passed ? "Backend AI Review Passed" : "Backend AI Review Failed",
        description: excerpt,
        color: passed ? 0x00796b : 0xba1a1a,
        fields: [
          {
            name: "Actor",
            value: process.env.GITHUB_ACTOR ?? "unknown",
            inline: true
          },
          {
            name: "Commit",
            value: `[${(process.env.GITHUB_SHA ?? "").slice(0, 7)}](${commitUrl})`,
            inline: true
          },
          {
            name: "Workflow Run",
            value: `[Open run](${runUrl})`,
            inline: false
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
