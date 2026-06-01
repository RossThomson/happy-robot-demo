# Deployment Guide

This project deploys as a Dockerized Next.js app with PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Fly.io CLI (optional, for cloud deploy)
- HappyRobot platform account

## Local Docker

1. Copy environment file:

```bash
cp .env.example .env
```

2. Set `API_KEY` in `.env` to a secure random string.

3. Start services:

```bash
docker compose up --build
```

4. In another terminal, push schema and seed data:

```bash
npm run db:push
npm run db:seed
```

(Postgres is exposed on host port **5433** — see `.env.example`.)

5. Open:

- App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Health: http://localhost:3000/api/health

## Fly.io Deployment

1. Install Fly CLI and log in:

```bash
fly auth login
```

2. Create app and Postgres:

```bash
fly launch --no-deploy
fly postgres create --name happyrobot-db
fly postgres attach happyrobot-db
```

3. Set secrets:

```bash
fly secrets set API_KEY=your-secure-api-key
fly secrets set HAPPYROBOT_API_KEY=sk_live_... HAPPYROBOT_WORKFLOW_ID=your-workflow-id
fly secrets set FMCSA_WEB_KEY=your-fmcsa-key   # optional
```

4. Deploy:

```bash
fly deploy
```

5. Push schema and seed (one-time)

**Do not run this inside the Fly app container** — the production image is a slim Next.js standalone build and does not include `drizzle-kit` or `tsx` (they are devDependencies).

Run migrations **from your laptop** against Fly Postgres:

```bash
# Terminal 1 — proxy Fly Postgres to localhost
fly proxy 15432:5432 -a happyrobot-db

# Terminal 2 — use credentials from your Fly Postgres app
# (find user/password/db with: fly postgres connect -a happyrobot-db, or in the Fly dashboard)
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:15432/happyrobot?sslmode=disable"
npm run db:push
npm run db:seed
```

If `DATABASE_URL` is already set as a secret on your web app, you can copy the connection string from the Fly dashboard (Postgres → Connection string) and replace the host with `localhost:15432` while the proxy is running.

Alternative: use `fly postgres connect -a happyrobot-db` to open `psql` and verify the database, but schema changes should still go through `npm run db:push` locally.

## HTTPS

- **Fly.io**: HTTPS is provisioned automatically.
- **Local**: Use HTTP for development. Self-signed certs are acceptable per assignment for local use.

## API Authentication

All API routes except `GET /api/health` require:

```
x-api-key: <your API_KEY>
```

Configure this header in HappyRobot workflow API tool nodes.

## Reproducing Deployment

| Step | Command |
|------|---------|
| Build image | `docker build -t happy-robot-demo .` |
| Run stack | `docker compose up` |
| Migrate DB | `npm run db:push` |
| Seed data | `npm run db:seed` |
| Verify health | `curl http://localhost:3000/api/health` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | Yes | API authentication key |
| `FMCSA_WEB_KEY` | No | FMCSA QCMobile API key (US only) |
| `HAPPYROBOT_API_KEY` | No* | Happy Robot platform API key for `/demo` web calls |
| `HAPPYROBOT_WORKFLOW_ID` | No* | Workflow with Web Call trigger (required for `/demo` calls) |
| `NEGOTIATION_FLOOR_RATIO` | No | Min broker pay as fraction of list; caps counters only (default 0.85) |
| `NEGOTIATION_CEILING_RATIO` | No | Max broker pay as fraction of list; caps counters only (default 1.10) |

\*Both required to start web calls from `/demo`.
