# Git Notifications: GitHub Actions + Discord

Kênh Discord đề xuất: `#git-notification`

## Mục tiêu

Kênh này nhận thông báo ngắn để nhóm theo dõi repo mà không cần mở GitHub liên tục:

- Commit mới được push lên `main`.
- Issue mới, issue đóng/mở lại, hoặc issue được gán.
- Pull request mới, PR có commit mới, PR merge/đóng.
- Kết quả `Backend Algorithm CI`, gồm typecheck, test thuật toán, build backend và AI review.

## GitHub Secrets

| Secret | Required | Purpose |
| --- | --- | --- |
| `DISCORD_GIT_WEBHOOK_URL` | Yes | Webhook Discord riêng cho kênh `#git-notification`. |
| `DISCORD_GIT_MENTION` | Optional | Mention user/role khi Backend Algorithm CI fail, ví dụ `<@123>` hoặc `<@&456>`. |

Không commit webhook URL hoặc token vào repository.

## Workflow

File workflow: `.github/workflows/git-discord-notifications.yml`

Workflow chạy khi có:

- `push` vào `main`
- `issues`
- `pull_request`
- `workflow_run` hoàn tất cho `Backend Algorithm CI`
- `workflow_dispatch` để test thủ công

Script gửi Discord: `.github/scripts/notify-git-discord.mjs`

## Discord Format

Thông báo được cố ý giữ gọn:

- Tiêu đề theo loại sự kiện.
- Actor, repo, branch/PR/issue/commit.
- Tối đa 3 commit hoặc một đoạn mô tả ngắn.
- Link mở thẳng GitHub Actions, commit, issue hoặc PR.

Khi `Backend Algorithm CI` fail, Discord chỉ nhận tóm tắt và link xem chi tiết. Log đầy đủ vẫn nằm trong GitHub Actions.
