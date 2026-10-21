# Guardian MCP server

## What it is

Guardian is a self-hosted Model Context Protocol server that supports an Alexa+ assistant in protecting elderly users from impersonation scams such as "digital arrest" calls. It scores suspicious situations for risk, returns grounded safety guidance, and lets the assistant notify trusted family members. It is written in TypeScript against MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express`) with Zod v4 schemas.

## Transport

- **Streamable HTTP** at `POST /mcp`.
- **Stateless**: a new server and transport are created for every request; no session state is carried between calls.
- **Health check**: `GET /health` returns `200 OK`.
- **Protocol versions**: `2025-11-25` and `2026-07-28` (`2026-07-28` is the latest version in SDK 2.3.1).

## Tools

| Name | Input | Returns |
| --- | --- | --- |
| `assess_scam_risk` | `{ situation: string, locale?: "hi-IN" \| "en-IN" \| "en-US" }` | `RiskAssessment`: `score` (0-100), `band`, `typology`, `flags` with evidence, `recommendedAction`, `explanation`. Sent as `structuredContent` plus a short text summary. |
| `get_safety_guidance` | `{ typology: string, locale? }` | Two to three facts with source URLs, next steps, and a ready-to-speak reply of at most three sentences in the user's language. |
| `notify_family` | `{ summary: string, severity: "info" \| "warning" \| "critical", typology?: string, score?: number }` | Event id. The event is stored in memory and appended to `data/events.json`. Summaries only, never transcripts. |
| `get_household_context` | `{}` | Persona and trusted contacts, with no secrets. |

## Server instructions

The assistant is told to call `assess_scam_risk` first whenever the user describes a call or message involving money, police, arrest, secrecy, or a relative in trouble. If the resulting band is high or critical, it should call `get_safety_guidance` and then `notify_family`. It should speak calmly throughout.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listen port. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin. |
| `HOST` | `127.0.0.1` | Bind address. |

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
