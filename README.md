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

Run `npm run db:seed` after `db:push` so loads and carriers are available. Use **Reset dashboard data** on `/dashboard` (or `POST /api/dashboard/reset`) to clear call metrics between demos.

### Sample loads (seed)

| Load ID  | Lane                         | Equipment | List rate |
| -------- | ---------------------------- | --------- | --------- |
| LD-1001  | Chicago, IL → Dallas, TX     | Dry Van   | $2,100    |
| LD-1002  | Atlanta, GA → Miami, FL      | Reefer    | $1,850    |
| LD-1004  | Houston, TX → Denver, CO     | Flatbed   | $3,200    |

Twenty seeded loads total (`LD-1001`–`LD-1020`). Search via `GET /api/loads?origin=...&destination=...&equipment_type=...`.

## Test call examples

Use these with the **Web Call** workflow ([`/demo`](http://localhost:3000/demo)) or by exercising the API directly. Say rates in words during voice calls (e.g. “twenty-four hundred”); use numeric values in API bodies.

### 1. Successful booking with negotiation

| Field | Value |
| ----- | ----- |
| MC | `123456` (Midwest Express) |
| Lane | Chicago → Dallas |
| Equipment | Dry Van |
| Expected load | **LD-1001** @ **$2,100** |

**Suggested dialogue**

1. Give MC **123456** when asked.
2. Ask for **Chicago to Dallas**, **dry van**.
3. When pitched **LD-1001** at twenty-one hundred, counter: *“Can you do twenty-four hundred?”*
4. Agent should counter around **twenty-two fifty** (negotiate tool `counterRate`).
5. Accept: *“Twenty-two fifty works.”*
6. Expect: *“Transfer was successful and now you can wrap up the conversation.”*

**API check (optional)**

```bash
curl -X POST http://localhost:3000/api/negotiate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"session_id":"test-1","load_id":"LD-1001","offered_rate":2400,"round":1}'
# → status "countered", counterRate 2250

curl -X POST http://localhost:3000/api/negotiate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"session_id":"test-1","load_id":"LD-1001","offered_rate":2250,"round":2}'
# → status "accepted", agreedRate 2250
```

### 2. Book at posted rate (no negotiation)

| Field | Value |
| ----- | ----- |
| MC | `789012` (Sunbelt Transport) |
| Lane | Chicago → Dallas |
| Equipment | Dry Van |
| Expected load | **LD-1001** @ **$2,100** |

After the pitch, say *“Yeah, twenty-one hundred works”* or *“Book it at your rate.”* The negotiate tool accepts offers at or below list without counters.

### 3. Ineligible carrier (mock rejection)

| Field | Value |
| ----- | ----- |
| MC | `567890` (Suspended Haulers — not eligible) |
| Lane | Any (e.g. Dallas → Houston, dry van) |

Agent should verify MC, explain ineligibility, and end the call without searching loads.

```bash
curl -X POST http://localhost:3000/api/verify-mc \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"mc_number":"567890"}'
# → eligible: false
```

### 4. Negotiation fails after three rounds

| Field | Value |
| ----- | ----- |
| MC | `789012` |
| Lane | Chicago → Dallas |
| Equipment | Dry Van |
| Expected load | **LD-1001** @ **$2,100** (ceiling ~**$2,310**) |

**Suggested dialogue**

1. *“I need twenty-six hundred.”* → broker counters **twenty-one ten** (max on this load).
2. *“Can't do less than twenty-five hundred.”* → broker holds **twenty-one ten** (counters do not move backward).
3. *“Twenty-four eighty or nothing.”* → round 3 **declined**; agent gives best-and-final, then closes politely.

### 5. Different lane / equipment (reefer)

| Field | Value |
| ----- | ----- |
| MC | `345678` (Pacific Coast Carriers) |
| Lane | Atlanta → Miami |
| Equipment | Reefer |
| Expected load | **LD-1002** @ **$1,850** |

Useful to confirm load search returns a different match than the Chicago–Dallas dry van path.

---

After a test call, open [`/dashboard`](http://localhost:3000/dashboard) to see outcomes and metrics. Full voice-agent scripts and HappyRobot setup: [`docs/happyrobot-workflow.md`](./docs/happyrobot-workflow.md).

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
