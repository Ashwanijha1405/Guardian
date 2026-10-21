# Guardian — project context (read this first, every session)

## What this is
Guardian is an Alexa+ integration (Amazon Developer Hackathon "Build, Ship, Shape", Alexa+ track).
It protects elderly people in India from **"digital arrest"** scams (fake CBI/ED/police officers on video
calls demanding money and secrecy) and generalizes to other impersonation scams (fake RBI "safe account",
courier/narcotics parcel, US grandparent voice-clone, US IRS/arrest-warrant calls).

Persona for the demo: **Dadi** (elderly, speaks Hindi/Hinglish/English mixed), lives alone.
Grandson **Rahul** lives in another city and is the trusted family contact.

## Hard requirements (from hackathon rules — do not violate)
- The core deliverable is a **self-hosted MCP server**, MCP spec **2025-11-25 or later**, **Streamable HTTP** transport.
- The repo must actually load/run the MCP server in code (not just mention it in the README).
- The repo must contain all source + instructions to run it.
- Demo video < 3 minutes must clearly show it working.

## Architecture (monorepo, npm workspaces, TypeScript everywhere, Node 20+)
```
guardian/
  packages/
    risk-engine/   # pure TS library, no I/O: scam typology scoring (deterministic, explainable)
    server/        # Guardian MCP server (Streamable HTTP) + family dashboard + events API
    simulator/     # "Alexa+ simulator": web page + small Node backend acting as the MCP host/client
  data/            # household.json (persona, contacts), safety-facts.json (authoritative facts + source URLs)
  docs/            # friction-log.md, feedback.md, video-script.md
```

### Flow
Dadi speaks → simulator (Web Speech API, hi-IN/en-IN) → simulator backend LLM agent ("Alexa")
→ MCP client → Guardian MCP server tools → risk engine / verification loop / family events
→ reply text + MCP Apps UI card → simulator speaks reply and renders the card.
Rahul's dashboard (served by the server) receives live events via SSE and can tap "I'm safe".

## Tech decisions (fixed — don't relitigate)
- MCP TypeScript **SDK v2**: `@modelcontextprotocol/server@^2`, `@modelcontextprotocol/client@^2`,
  `@modelcontextprotocol/node@^2`, `@modelcontextprotocol/express@^2`, `zod@^4`.
  Do NOT use the old `@modelcontextprotocol/sdk` v1 package or code from v1 tutorials.
- MCP Apps: `@modelcontextprotocol/ext-apps` (UI resources with `ui://` URIs; server helpers from
  `@modelcontextprotocol/ext-apps/server`; host side from `@modelcontextprotocol/ext-apps/app-bridge`).
- Before writing SDK code, read the current docs/examples — APIs changed in v2:
  - https://ts.sdk.modelcontextprotocol.io/v2/
  - https://github.com/modelcontextprotocol/ext-apps (examples/basic-server-vanillajs, examples/basic-host)
  - If the `mcp-apps` Claude Code plugin skills are installed (create-mcp-app, add-app-to-server), use them.
- Risk engine is **deterministic rules + weights**, NOT an LLM call. Every flag must carry the evidence
  phrase that triggered it. LLMs are only used in the simulator as the "Alexa" agent.
- Storage: in-memory + JSON files. No database.
- LLM for simulator: provider-pluggable via env (`LLM_PROVIDER=gemini|anthropic|openai`), default Gemini.
  API keys only in `.env` (gitignored) — never in frontend code, never committed.
- Frontend: plain Vite + vanilla TS (or Preact if needed). No heavy frameworks. Large, high-contrast, elderly-friendly UI.

## Product principles (these are judged — keep them visible in code and UI)
- Dignity-first: no call recording, Rahul sees summaries not transcripts, Dadi stays in control.
- Explainable: every risk score shows its reasons.
- Calm voice: replies are short, warm, firm. Never shame the user.
- Truthful: only state facts from `data/safety-facts.json`, each of which has a source URL.

## Working rules for Claude Code
- Work only in the folder the current phase names. Don't touch other packages unless the phase says so.
- After each phase: run build + tests, fix failures, then commit with message `phase-N: <summary>`.
- Keep a running list of setup friction (confusing docs, errors, workarounds) in `docs/friction-log.md`
  — this earns a judging bonus. One entry per real problem: task, steps, expected vs actual, severity, workaround, suggestion.
- If something in the plan is impossible or the API differs from the plan, stop, explain, and propose the smallest fix.

## Learning mode (the user is a student who wants to understand every line)
- Before writing code in a phase, give a 5-line plan of what you will build and why, then wait for me to say "go".
- Keep functions small. Add a short comment only where the *why* is not obvious.
- After finishing, give me: (1) the 3 most important files to read, (2) one thing in them that I should be able to
  explain in a viva, (3) one question to test me. Do not skip this.
- If I ask "explain", explain in Hinglish, line by line, with a sample input and a dry run.
