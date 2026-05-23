# Backend Deploy: Render + Railway PostgreSQL

Backend service name: `routelab-backend`

## Flow

1. Backend code is pushed to `main`.
2. GitHub Actions runs backend typecheck, tests, build, and Gemini AI review.
3. Render deploys only after GitHub checks pass because `render.yaml` uses:

```yaml
autoDeployTrigger: checksPass
```

## Render Blueprint

Use the repository Blueprint:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/xuanhai0913/tsp-delivery-route-optimizer
```

During setup, Render reads `render.yaml` and creates the web service from `backend/`.

## Render Environment Variables

Set these in Render Dashboard:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Railway public PostgreSQL URL. Use the public proxy host, not `postgres.railway.internal`. |
| `DATABASE_PUBLIC_URL` | Optional fallback name for Railway public PostgreSQL URL if `DATABASE_URL` is not set. |
| `DATABASE_SSL` | `false` by default for the current Railway proxy. Set `true` only if Railway requires SSL. |
| `CORS_ORIGIN` | `https://maps.hailamdev.space` |
| `NODE_ENV` | `production` |
| `DATASET_SOURCE` | `auto` by default. Use `database` to require PostgreSQL, or `json` to force sample files. |

Do not commit database URLs to the repository.

## GitHub Actions Secrets

Set these in GitHub repository settings:

| Secret | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Runs backend AI review with `gemini-2.5-flash`. |
| `DISCORD_WEBHOOK_URL` | Optional | Sends backend AI review result to a Discord channel. |
| `DISCORD_MENTION` | Optional | Mentions a user or role when the AI review gate fails, for example `<@123>` or `<@&456>`. |
| `DISCORD_GIT_WEBHOOK_URL` | Optional | Sends compact Git, issue, PR, and backend CI notifications to `#git-notification`. |
| `DISCORD_GIT_MENTION` | Optional | Mentions a user or role when the backend CI notification reports a failure. |

The backend deploy gate fails when AI review finds at least 1 critical issue or more than 5 warnings.
AI review content is written in Vietnamese. GitHub Actions keeps the full review summary, while Discord receives a compact notification with counts, a short summary, up to 3 highlighted issues, and a workflow link.

## Discord Webhook

To notify Discord:

1. Open Discord channel settings.
2. Go to `Integrations` -> `Webhooks`.
3. Create a webhook, choose the target channel, then copy the webhook URL.
4. Add it to GitHub Actions secrets as `DISCORD_WEBHOOK_URL`.

If the webhook secret is missing, CI skips Discord notification without failing.

General Git notifications are documented in `docs/git-notifications.md`.

## Health Checks

Render uses:

```text
GET /health
```

Database connectivity can be checked manually with:

```text
GET /health/db
```

## Database Setup

After `DATABASE_URL` or `DATABASE_PUBLIC_URL` is configured, run these commands
from the Render shell or a local machine that can reach the database:

```bash
cd backend
npm run db:setup
```

This applies SQL migrations from `backend/db/migrations/` and imports graph
datasets from `data/samples/*.json`.

The database schema is described in `docs/database.md`.
