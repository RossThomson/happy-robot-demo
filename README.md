# Inbound Carrier Sales — HappyRobot FDE Take-Home

Proof of concept for automating inbound carrier load sales: MC verification, load matching, price negotiation, and custom metrics dashboard.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone https://github.com/RossThomson/happy-robot-demo.git
cd happy-robot-demo
npm install

# Environment
cp .env.example .env
# Edit .env — set API_KEY

# Start PostgreSQL
docker compose up db -d

# Push schema and seed data
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3000

### Docker (full stack)

```bash
cp .env.example .env
docker compose up --build
# In another terminal:
npm run db:push && npm run db:seed
```

See [DEPLOY.md](./DEPLOY.md) for cloud deployment instructions.

## Test MC Numbers

FMCSA API access requires a US-based developer account and is geo-locked internationally. When FMCSA is unavailable, the API falls back to a mock carrier registry.

| MC Number | Status   | Eligible |
| --------- | -------- | -------- |
| 123456    | Active   | Yes      |
| 789012    | Active   | Yes      |
| 345678    | Active   | Yes      |
| 901234    | Active   | Yes      |
| 567890    | Inactive | No       |
| 111111    | Active   | No       |

## API Reference

All endpoints except `/api/health` require header: `x-api-key: YOUR_API_KEY`

| Method | Endpoint         | Description                                                         |
| ------ | ---------------- | ------------------------------------------------------------------- |
| GET    | `/api/health`    | Health check (public)                                               |
| GET    | `/api/loads`     | Search loads (`origin`, `destination`, `equipment_type`, `load_id`) |
| GET    | `/api/loads/:id` | Get load by ID                                                      |
| POST   | `/api/verify-mc` | Verify MC number                                                    |
| POST   | `/api/negotiate` | Evaluate counter-offer                                              |
| POST   | `/api/calls`     | Record call outcome                                                 |
| GET    | `/api/metrics`   | Dashboard metrics                                                   |
| POST   | `/api/dashboard/reset` | Clear calls and negotiation sessions (dashboard demo reset) |

### Example: Verify MC

```bash
curl -X POST http://localhost:3000/api/verify-mc \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"mc_number": "123456"}'
```

### Example: Search Loads

```bash
curl "http://localhost:3000/api/loads?origin=Chicago&destination=Dallas&equipment_type=Dry%20Van" \
  -H "x-api-key: YOUR_API_KEY"
```

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   ├── dashboard/    # Metrics dashboard
│   └── demo/         # Web call demo instructions
├── db/
│   ├── schema.ts     # Drizzle schema
│   └── seed.ts       # Seed data
├── lib/              # Business logic
└── components/       # Dashboard charts
```

## License

Private — take-home assessment submission.
