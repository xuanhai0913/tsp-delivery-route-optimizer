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
| `DATABASE_SSL` | `false` by default for the current Railway proxy. Set `true` only if Railway requires SSL. |
| `CORS_ORIGIN` | `https://maps.hailamdev.space` |
| `NODE_ENV` | `production` |

Do not commit database URLs to the repository.

## GitHub Actions Secrets

Set these in GitHub repository settings:

| Secret | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Runs backend AI review with `gemini-2.5-flash`. |
| `DISCORD_WEBHOOK_URL` | Optional | Sends backend AI review result to a Discord channel. |
| `DISCORD_MENTION` | Optional | Mentions a user or role when the AI review gate fails, for example `<@123>` or `<@&456>`. |

The backend deploy gate fails when AI review finds at least 1 critical issue or more than 5 warnings.

## Discord Webhook

To notify Discord:

1. Open Discord channel settings.
2. Go to `Integrations` -> `Webhooks`.
3. Create a webhook, choose the target channel, then copy the webhook URL.
4. Add it to GitHub Actions secrets as `DISCORD_WEBHOOK_URL`.

If the webhook secret is missing, CI skips Discord notification without failing.

## Health Checks

Render uses:

```text
GET /health
```

Database connectivity can be checked manually with:

```text
GET /health/db
```
