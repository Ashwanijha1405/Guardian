# Guardian MCP server

## What it is

Guardian is a self-hosted Model Context Protocol server that supports an Alexa+ assistant in protecting elderly users from impersonation scams such as "digital arrest" calls. It scores suspicious situations for risk, returns grounded safety guidance, and lets the assistant notify trusted family members. It is written in TypeScript against MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express`) with Zod v4 schemas.

## Transport

- **Streamable HTTP** at `POST /mcp`.
- **Stateless**: a new server and transport are created for every request; no session state is carried between calls.
- **Health check**: `GET /health` returns `200 OK`.
- **Protocol versions**: `2025-11-25` and `2026-07-28` (`2026-07-28` is the latest version in SDK 2.3.1).

## Family API (for the dashboard)

| Endpoint | Description |
| --- | --- |
| `GET /events` | JSON snapshot: `{ alerts, verifications, household: { persona, contacts } }`. Contacts never include phone numbers. |
| `GET /events/stream` | Server-Sent Events. First a `snapshot` event (same shape as `GET /events`), then live `alert` events (from `notify_family`) and `verification` events (created or answered). A `: ping` comment every 25 s keeps proxies from closing the stream. |
| `POST /verifications/:id/respond` | Body `{ "status": "confirmed_safe" \| "needs_help" }`. Returns the updated request; 400 on a bad status, 404 for an unknown id. |

```sh
curl -N http://localhost:3000/events/stream
curl -X POST http://localhost:3000/verifications/<id>/respond \
  -H "Content-Type: application/json" -d '{"status":"confirmed_safe"}'
```

Verification requests are kept in memory only and are lost on restart. Alerts are also written to `data/events.json`.

## Tools

| Name | Input | Returns |
| --- | --- | --- |
| `assess_scam_risk` | `{ situation: string, locale?: "hi-IN" \| "en-IN" \| "en-US" }` | `RiskAssessment`: `score` (0-100), `band`, `typology`, `flags` with evidence, `recommendedAction`, `explanation`. Sent as `structuredContent` plus a short text summary. |
| `get_safety_guidance` | `{ typology: string, locale? }` | Two to three facts with source URLs, next steps, and a ready-to-speak reply of at most three sentences in the user's language. |
| `notify_family` | `{ summary: string, severity: "info" \| "warning" \| "critical", typology?: string, score?: number }` | Event id. The event is stored in memory and appended to `data/events.json`. Summaries only, never transcripts. |
| `get_household_context` | `{}` | Persona and trusted contacts, with no secrets. |
| `verify_with_family` | `{ reason: string (one-line summary, max 280, never a transcript), claimed_person?: string, typology?: string, locale? }` | `{ request_id, contact_name, status: "pending", say }`. Creates a verification request for the household's primary trusted contact and pushes it live to the family dashboard: out-of-band verification through a known channel, as the FBI advises. |
| `check_verification` | `{ request_id: string, locale? }` | `{ request_id, contact_name, status, say }`. Status is `pending`, `confirmed_safe`, `needs_help`, or `no_response` (still pending after `VERIFICATION_TIMEOUT_MS`, default 90000 ms). `say` is a ready-to-speak line in romanized Hindi or English. |

## Server instructions

The assistant is told to call `assess_scam_risk` first whenever the user describes a call or message involving money, police, arrest, secrecy, or a relative in trouble. If the resulting band is high or critical, it should call `get_safety_guidance` and then `notify_family`. If the caller claims to be a relative in trouble, or the user is unsure, it should call `verify_with_family`, then poll `check_verification` every few seconds until the status is no longer pending. It should speak calmly throughout.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listen port. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin. |
| `HOST` | `127.0.0.1` | Bind address. |
| `VERIFICATION_TIMEOUT_MS` | `90000` | How long a verification stays `pending` before `check_verification` reports `no_response`. |

## Run locally

From the repo root:

```sh
npm install
npm run dev:server
```

Test with MCP Inspector:

```sh
npm run inspect -w @guardian/server
```

In the Inspector, connect to `http://localhost:3000/mcp` and choose transport **Streamable HTTP**.

Run the test suite:

```sh
npm test
```

### Quick curl example

Initialize a session directly against the endpoint:

```sh
curl -s http://localhost:3000/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "0.1.0" }
    }
  }'
```

## Privacy

Guardian never records calls. Family members receive summaries only; raw conversations and transcripts are not stored or shared.
