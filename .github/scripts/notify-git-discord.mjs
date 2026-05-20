import { readFile } from "node:fs/promises";

const webhookUrl = process.env.DISCORD_GIT_WEBHOOK_URL;

if (!webhookUrl) {
  process.exit(0);
}

const eventName = process.env.GITHUB_EVENT_NAME ?? "unknown";
const eventPath = process.env.GITHUB_EVENT_PATH;
const repo = process.env.GITHUB_REPOSITORY ?? "unknown/repo";
const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
const runUrl = `${serverUrl}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const actor = process.env.GITHUB_ACTOR ?? "unknown";
const mention = process.env.DISCORD_GIT_MENTION?.trim();
const payload = eventPath
  ? await readFile(eventPath, "utf8").then(JSON.parse).catch(() => ({}))
  : {};

function truncate(text, maxLength) {
  if (!text) {
    return "";
  }

  const normalized = String(text).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized;
}

function branchFromRef(ref) {
  if (!ref) {
    return process.env.GITHUB_REF_NAME ?? "unknown";
  }

  return ref.replace("refs/heads/", "").replace("refs/tags/", "");
}

function shortSha(value) {
  return value ? String(value).slice(0, 7) : "unknown";
}

function field(name, value, inline = true) {
  return {
    name,
    value: truncate(value, 1024) || "N/A",
    inline
  };
}

function issueActionLabel(action) {
  return {
    opened: "Issue mới",
    reopened: "Issue mở lại",
    closed: "Issue đã đóng",
    edited: "Issue vừa sửa",
    assigned: "Issue được gán"
  }[action] ?? `Issue ${action ?? "updated"}`;
}

function pullRequestActionLabel(action, pullRequest) {
  if (action === "closed" && pullRequest?.merged) {
    return "PR đã merge";
  }

  return {
    opened: "PR mới",
    reopened: "PR mở lại",
    closed: "PR đã đóng",
    synchronize: "PR có commit mới",
    ready_for_review: "PR sẵn sàng review"
  }[action] ?? `PR ${action ?? "updated"}`;
}

function workflowConclusionLabel(conclusion) {
  return {
    success: "đạt",
    failure: "thất bại",
    cancelled: "bị hủy",
    skipped: "bị bỏ qua",
    timed_out: "quá thời gian",
    action_required: "cần thao tác"
  }[conclusion] ?? (conclusion || "không rõ");
}

function buildPushEmbed() {
  const branch = branchFromRef(payload.ref);
  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  const pusher = payload.pusher?.name ?? actor;
  const visibleCommits = commits.slice(0, 3).map((commit) => {
    const title = truncate(commit.message?.split("\n")[0], 90);
    return `- [${shortSha(commit.id)}](${commit.url}) ${title}`;
  });
  const extraCount = commits.length > visibleCommits.length ? `\n+ ${commits.length - visibleCommits.length} commit khác` : "";
  const description = [
    `**${pusher}** vừa push **${commits.length || 1}** commit lên \`${branch}\`.`,
    visibleCommits.join("\n") + extraCount,
    payload.compare ? `[Xem diff trên GitHub](${payload.compare})` : `[Mở workflow](${runUrl})`
  ].filter(Boolean).join("\n\n");

  return {
    title: "Commit mới trên GitHub",
    description: truncate(description, 1400),
    color: 0x2563eb,
    fields: [
      field("Repo", repo),
      field("Branch", branch),
      field("Actor", actor)
    ]
  };
}

function buildIssueEmbed() {
  const issue = payload.issue ?? {};
  const sender = payload.sender?.login ?? actor;
  const labels = Array.isArray(issue.labels) && issue.labels.length > 0
    ? issue.labels.map((label) => label.name).slice(0, 5).join(", ")
    : "Chưa có label";
  const description = [
    `**${truncate(issue.title, 180)}**`,
    issue.html_url ? `[Mở issue #${issue.number}](${issue.html_url})` : undefined,
    truncate(issue.body, 350)
  ].filter(Boolean).join("\n\n");

  return {
    title: issueActionLabel(payload.action),
    description: truncate(description, 1200),
    color: payload.action === "closed" ? 0x00796b : 0x8b5cf6,
    fields: [
      field("Issue", `#${issue.number ?? "?"}`),
      field("Người thao tác", sender),
      field("Trạng thái", issue.state ?? "unknown"),
      field("Labels", labels, false)
    ]
  };
}

function buildPullRequestEmbed() {
  const pullRequest = payload.pull_request ?? {};
  const sender = payload.sender?.login ?? actor;
  const merged = payload.action === "closed" && pullRequest.merged;
  const description = [
    `**${truncate(pullRequest.title, 180)}**`,
    pullRequest.html_url ? `[Mở PR #${pullRequest.number}](${pullRequest.html_url})` : undefined,
    truncate(pullRequest.body, 350)
  ].filter(Boolean).join("\n\n");

  return {
    title: pullRequestActionLabel(payload.action, pullRequest),
    description: truncate(description, 1200),
    color: merged ? 0x7c3aed : payload.action === "closed" ? 0x6b7280 : 0xf59e0b,
    fields: [
      field("PR", `#${pullRequest.number ?? "?"}`),
      field("Người thao tác", sender),
      field("Nhánh", `${pullRequest.head?.ref ?? "?"} -> ${pullRequest.base?.ref ?? "?"}`, false)
    ]
  };
}

function buildWorkflowRunEmbed() {
  const workflowRun = payload.workflow_run ?? {};
  const conclusion = workflowRun.conclusion ?? "unknown";
  const passed = conclusion === "success";
  const branch = workflowRun.head_branch ?? "unknown";
  const commitUrl = `${serverUrl}/${repo}/commit/${workflowRun.head_sha}`;
  const description = [
    `Backend Algorithm CI đã **${workflowConclusionLabel(conclusion)}**.`,
    "Pipeline gồm typecheck, test thuật toán, build backend và AI review.",
    workflowRun.html_url ? `[Xem chi tiết run](${workflowRun.html_url})` : `[Mở workflow](${runUrl})`
  ].join("\n\n");

  return {
    title: passed ? "CI Backend Đạt" : "CI Backend Cần Xử Lý",
    description: truncate(description, 1200),
    color: passed ? 0x00796b : 0xba1a1a,
    fields: [
      field("Branch", branch),
      field("Commit", `[${shortSha(workflowRun.head_sha)}](${commitUrl})`),
      field("Người chạy", workflowRun.actor?.login ?? actor)
    ]
  };
}

function buildManualEmbed() {
  return {
    title: "Git Notification Đã Kết Nối",
    description: [
      "Webhook `#git-notification` đang hoạt động.",
      "Kênh này sẽ nhận push main, issue, PR và kết quả Backend Algorithm CI."
    ].join("\n\n"),
    color: 0x00796b,
    fields: [
      field("Repo", repo),
      field("Actor", actor),
      field("Workflow", `[Mở run](${runUrl})`)
    ]
  };
}

function buildEmbed() {
  if (eventName === "push") {
    return buildPushEmbed();
  }

  if (eventName === "issues") {
    return buildIssueEmbed();
  }

  if (eventName === "pull_request") {
    return buildPullRequestEmbed();
  }

  if (eventName === "workflow_run") {
    return buildWorkflowRunEmbed();
  }

  return buildManualEmbed();
}

const embed = buildEmbed();
const shouldMention = eventName === "workflow_run" && payload.workflow_run?.conclusion && payload.workflow_run.conclusion !== "success";

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "RouteLab Git",
    content: shouldMention && mention ? `${mention} CI backend cần xem lại.` : undefined,
    allowed_mentions: mention ? { parse: ["users", "roles"] } : { parse: [] },
    embeds: [
      {
        ...embed,
        url: runUrl,
        footer: {
          text: `RouteLab Group 1 • ${eventName}`
        },
        timestamp: new Date().toISOString()
      }
    ]
  })
});

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Discord git notification failed with ${response.status}: ${detail.slice(0, 500)}`);
}
