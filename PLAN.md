# Guardian — implementation plan & Claude Code handoffs

Deadline: **Oct 24, 12:30 AM IST** (Oct 23, 12:00 PM PDT). Target submit: **Oct 23, 10:00 PM IST**.
Each phase below = one Claude Code session in Orca. Start each with:
> Read CLAUDE.md and PLAN.md. Execute Phase N exactly. Stop when its acceptance checks pass.

Priority tiers:
- **Primary (must ship):** P1 risk engine, P2 MCP server, P3 verification loop, P5 simulator, P6 deploy, P7 submission.
- **Secondary:** P4 MCP Apps cards (big tech differentiator — do it unless badly behind).
- **Optional:** separate open-source package, AWS Bedrock, family code word tool, US typology polish.

| Phase | What | When (IST) | Budget |
|---|---|---|---|
| P0 | Repo setup | Now → 00:45 | 30 min |
| P1 | Risk engine + tests | 00:45 → 02:30 | 1.75 h |
| — | **Sleep** | 02:30 → 08:30 | non-negotiable |
| P2 | MCP server + core tools | Oct 22 09:00 → 12:00 | 3 h |
| P3 | Verification loop + family dashboard | 12:00 → 15:00 | 3 h |
| P4 | MCP Apps UI cards | 15:00 → 17:30 | 2.5 h |
| P5 | Alexa+ simulator | 17:30 → 23:30 | 6 h |
| P6 | Deploy + end-to-end | Oct 23 09:00 → 12:00 | 3 h |
| P7 | README, feedback, video, submit | 12:00 → 22:00 | 10 h incl. recording |

**Cut rule:** if P3 isn't done by 4 PM Oct 22, skip P4 and go straight to P5. If P5 isn't working by
Oct 23 noon, record the demo using MCP Inspector + dashboard instead of the simulator.

---

## P0 — Repo setup (you do this manually, ~30 min)

1. Create a GitHub repo `guardian` (private for now; add the 5 Amazon reviewers at submission time, or make public with LICENSE).
2. Put `CLAUDE.md` and `PLAN.md` in the repo root.
3. In Claude Code, install the MCP Apps skills:
   ```
   /plugin marketplace add modelcontextprotocol/ext-apps
   /plugin install mcp-apps@modelcontextprotocol-ext-apps
   ```
4. Get an LLM API key for the simulator (Gemini from Google AI Studio is simplest; check its free-tier
   limits on your account). Put it in `.env` later — never commit it.
5. Handoff prompt:

```
Read CLAUDE.md and PLAN.md. Execute Phase 0 scaffolding:
- Initialise an npm workspaces monorepo with packages/risk-engine, packages/server, packages/simulator,
  plus data/ and docs/ folders as in CLAUDE.md.
- TypeScript strict mode, a shared tsconfig.base.json, vitest for tests, tsx for running TS.
- Root scripts: build, test, dev:server, dev:simulator.
- .gitignore (node_modules, dist, .env), .env.example with LLM_PROVIDER, GEMINI_API_KEY,
  ANTHROPIC_API_KEY, OPENAI_API_KEY, GUARDIAN_MCP_URL, PORT.
- MIT LICENSE file. Empty docs/friction-log.md with a table header.
- Do not install MCP packages yet. Verify `npm run build` and `npm test` run (even with no tests).
Commit as "phase-0: scaffold".
```

**Accept:** `npm run build` passes; folder structure matches CLAUDE.md.

---

## P1 — Risk engine (tonight, the core IP)

```
Read CLAUDE.md and PLAN.md. Execute Phase 1 in packages/risk-engine only.

Build a pure TypeScript, dependency-free scam typology engine. This is AML-style typology scoring:
deterministic, explainable, testable.

API:
  assessRisk(input: { text: string; locale?: "hi-IN" | "en-IN" | "en-US" }): RiskAssessment
  RiskAssessment = {
    score: number;            // 0–100
    band: "low" | "medium" | "high" | "critical";
    typology: TypologyId | "none";   // best-matching scam pattern
    typologyConfidence: number;      // 0–1
    flags: Array<{ id: FlagId; label: string; weight: number; evidence: string }>; // evidence = matched phrase
    recommendedAction: "reassure" | "pause_and_verify" | "end_call_now";
    explanation: string;      // one plain-English sentence built from the flags
  }

Red-flag signals (each with weight; tune so the demo cases land correctly):
- authority_impersonation (CBI, ED, police, customs, RBI, TRAI, narcotics, IRS, FBI, "officer", "inspector", "sir from Mumbai police")
- arrest_threat ("arrest", "warrant", "jail", "digital arrest", "giraftaar", "case darj", "FIR")
- secrecy_demand ("don't tell anyone", "kisi ko mat batana", "keep this confidential", "don't tell your family")
- isolation_or_continuous_call (stay on video call, don't disconnect, "camera on rakho", "call mat kaatna")
- money_demand (transfer, pay, "paise bhejo", amounts like ₹/Rs/rupees/lakh/$)
- unusual_payment_rail (gift card, crypto, "RBI safe account", "verification account", UPI to unknown, wire)
- urgency (now, immediately, within 1 hour, "abhi", "turant", "jaldi")
- family_in_distress (grandson/son/daughter/beta/pota/naati is in jail/accident/hospital and needs money)
- parcel_or_courier_pretext (parcel, courier, FedEx, drugs found in package, "aapke naam pe parcel")
- money_laundering_accusation ("money laundering", "your Aadhaar used", "your account used for", "hawala")
- video_call_interrogation (Skype/WhatsApp video call, uniform, "police station" on video)

Typologies (each = required + supporting flags):
- digital_arrest (IN): authority_impersonation + arrest_threat, supported by secrecy, isolation, video, money_laundering_accusation, money_demand
- fake_rbi_safe_account (IN): authority_impersonation + unusual_payment_rail("safe/verification account")
- courier_narcotics (IN): parcel_or_courier_pretext + authority_impersonation or arrest_threat
- grandparent_voice_clone (US/global): family_in_distress + money_demand, supported by secrecy, urgency, unusual_payment_rail
- government_impersonation_us (US): IRS/FBI/SSA authority + arrest_threat or money_demand

Requirements:
- Matching must work for English, romanized Hinglish, and Devanagari Hindi. Keep lexicons in
  src/lexicons/*.ts as data, not buried in logic. Case/diacritic-insensitive; tolerate simple spelling variants.
- Score = combination of flag weights with a typology bonus, capped at 100. Document the formula in a
  comment and in packages/risk-engine/README.md.
- Bands: <25 low, 25–54 medium, 55–79 high, ≥80 critical. Action: low→reassure, medium/high→pause_and_verify, critical→end_call_now.
- Explanation built from the top flags, e.g. "Someone claiming to be police is threatening arrest and asking you to keep it secret."

Tests (vitest, at least 20 cases, in test/cases.test.ts with a data table):
- Demo case A (must be critical, digital_arrest): "Alexa, ek CBI officer video call pe hai, bol raha hai main digital arrest mein hoon, kisi ko batana mat, aur paise RBI safe account mein bhejne ko bol raha hai"
- Demo case B (must be ≥ high, grandparent_voice_clone): "My grandson just called crying, he's in jail and needs three thousand dollars in gift cards, he said don't tell his mom"
- Courier, fake RBI, US IRS cases; Devanagari-only case; mixed-script case.
- At least 6 BENIGN cases that must score low — e.g. "Rahul called, he's coming home for Diwali",
  "the courier delivered my medicines", "my son sent money for my bills", "police uncle came for the society meeting",
  "I watched a CBI movie on TV". False-positive control is the point: show precision, not just recall.
- Print a small confusion-style summary in test output (caught / missed / false positives).

Also export a `listTypologies()` and `listFlags()` for docs/UI.
Run tests until all pass. Commit "phase-1: risk engine".
```

**Accept:** all tests green; demo cases A and B score as required; benign cases low.
**Your check (5 min):** read 5 lexicon entries and 3 test cases yourself — you must be able to explain the scoring in the video and to judges.

---

## P2 — MCP server + core tools (Oct 22 morning)

```
Read CLAUDE.md and PLAN.md. Execute Phase 2 in packages/server (+ data/).

First: read the MCP TypeScript SDK v2 server docs (https://ts.sdk.modelcontextprotocol.io/v2/) and the
Streamable HTTP + Express adapter usage. Use @modelcontextprotocol/server@^2, @modelcontextprotocol/node@^2,
@modelcontextprotocol/express@^2, zod@^4. Note in packages/server/README.md which MCP protocol version is
negotiated — it must be 2025-11-25 or later.

Data files:
- data/household.json: Dadi (preferred language hi-IN, city), trusted contacts (Rahul: grandson, phone placeholder,
  relationship), locale.
- data/safety-facts.json: per typology, short authoritative facts in English + Hindi with a source URL each. Include:
  "There is no such thing as 'digital arrest' in Indian law"; real police/CBI never demand money or video-call interrogation;
  India cybercrime helpline 1930 and https://cybercrime.gov.in; US: hang up and call the relative back on a known number,
  family code word (FBI guidance), report at https://www.ic3.gov. Keep each fact one sentence. Put a TODO next to any
  fact whose source URL you could not confirm — I will verify these manually.

MCP server "guardian" exposing tools (zod input schemas, clear descriptions written FOR an assistant like Alexa):
1. assess_scam_risk { situation: string, locale?: string }
   → calls risk-engine; returns structuredContent = RiskAssessment and a short text summary.
2. get_safety_guidance { typology: string, locale?: string }
   → returns 2–3 facts + concrete next steps from safety-facts.json, plus a ready-to-speak reply in the
     user's language (calm, warm, firm, max 3 sentences).
3. notify_family { summary: string, severity: "info"|"warning"|"critical", typology?: string, score?: number }
   → appends an event to the in-memory event log (and data/events.json), returns event id.
4. get_household_context {} → persona + trusted contacts (no secrets).

Also:
- HTTP endpoint POST/GET /mcp via Streamable HTTP. Health check GET /health.
- Stateless-friendly; no session storage required beyond what the SDK needs.
- CORS configured for the simulator origin (env var).
- Server instructions string (MCP `instructions`) telling the assistant: when a user describes a call/message
  involving money, police, arrest, secrecy or a relative in trouble, call assess_scam_risk first; if band ≥ high,
  call get_safety_guidance then notify_family; speak the guidance calmly.

Test with MCP Inspector (npx @modelcontextprotocol/inspector) against http://localhost:PORT/mcp and
add a script `npm run inspect` that launches it. Add integration tests using @modelcontextprotocol/client@^2
that connect over Streamable HTTP and call each tool.
Log any SDK v2 / docs friction into docs/friction-log.md.
Commit "phase-2: mcp server".
```

**Accept:** Inspector lists 4 tools; demo case A via `assess_scam_risk` returns critical; integration tests pass.

---

## P3 — Verification loop + family dashboard (the differentiator)

```
Read CLAUDE.md and PLAN.md. Execute Phase 3 in packages/server.

Implement the out-of-band family verification loop (FBI advice: verify through a known trusted channel):
5. verify_with_family { claimed_person?: string, reason: string, typology?: string }
   → creates a VerificationRequest {id, contact, status:"pending", createdAt}, pushes it to the dashboard,
     returns {request_id, contact_name, status:"pending", say: "<what Alexa should say while waiting>"}.
6. check_verification { request_id: string }
   → returns status: pending | confirmed_safe | needs_help | no_response (no_response after 90s),
     plus a ready-to-speak line in the user's language.

Family dashboard (served by this server at /dashboard, Vite or plain static, large mobile-first layout,
it represents Rahul's phone):
- Live updates via Server-Sent Events from GET /events/stream.
- Incoming verification request card: "Dadi's Guardian: someone claiming to be CBI says Dadi is under 'digital arrest'.
  Are you safe? Is this real?" with buttons [I'm safe — it's a scam] [I need help] → POST /verifications/:id/respond.
- Alerts timeline from notify_family events: time, severity, typology, score, one-line summary.
  Dignity-first: show summaries only, never raw transcripts.
- Small "Household" panel: trusted contacts (read-only for now).
Simple, clean design: dark text on light background, big tap targets, Hindi + English labels.

Integration test: call verify_with_family → POST respond confirmed_safe → check_verification returns confirmed_safe.
Commit "phase-3: verification loop + dashboard".
```

**Accept:** open `/dashboard` in one window, trigger `verify_with_family` from Inspector, tap "I'm safe", `check_verification` flips to `confirmed_safe`.
**Parallel option:** while Claude Code does the logic, give agy (Gemini) only the dashboard *styling* in `packages/server/dashboard/` — one agent per folder.

---

## P4 — MCP Apps UI cards (secondary, strong tech signal)

```
Read CLAUDE.md and PLAN.md. Execute Phase 4 in packages/server.
Use the mcp-apps plugin skill "add-app-to-server" if available; otherwise follow the ext-apps README and
examples/basic-server-vanillajs. Use @modelcontextprotocol/ext-apps (server helpers from
@modelcontextprotocol/ext-apps/server).

Attach UI resources (ui:// scheme) to tools:
- assess_scam_risk → ui://guardian/risk-card: big score dial, band colour, typology name (Hindi + English),
  the flags list each with its evidence phrase, the recommended action. Echo Show–sized (approx 1280x800 landscape,
  must also fit 800x480). Calm palette, red only for critical.
- check_verification → ui://guardian/verified-card: "Rahul confirmed he is safe ✓" / "Rahul needs help" / "No response — call 1930".
The view receives tool results from the host (per ext-apps App class) — render from structuredContent.
Self-contained HTML (inline CSS/JS bundled), no external network calls from the view.
Verify the cards render using the ext-apps basic-host example pointed at our server.
Log friction to docs/friction-log.md. Commit "phase-4: mcp apps cards".
```

**Accept:** both cards render in basic-host with real tool output.

---

## P5 — Alexa+ simulator (the demo surface)

```
Read CLAUDE.md and PLAN.md. Execute Phase 5 in packages/simulator.

Build a web app that simulates an Echo Show running Alexa+ and acts as an MCP HOST/CLIENT for Guardian.

Backend (Node, small Express app):
- Connects to the Guardian MCP server at GUARDIAN_MCP_URL using @modelcontextprotocol/client@^2 over Streamable HTTP.
- Lists tools at startup and exposes them to an LLM agent loop (function calling). Provider pluggable via
  LLM_PROVIDER (gemini default). System prompt: you are Alexa+, speaking to an elderly Indian woman ("Dadi");
  reply in the language she used (Hindi/Hinglish/English); max 2–3 short sentences; be calm, warm, firm;
  follow the Guardian server instructions; never invent facts — use get_safety_guidance.
- For verification: after verify_with_family, poll check_verification every 3s up to 90s and stream interim
  "waiting" messages to the frontend.
- Endpoint POST /api/turn {text} → streams (SSE) events: transcript, tool_call (name + short args), tool_result,
  ui_resource (for MCP Apps), assistant_text.
- Keys only from .env.

Frontend (Vite, vanilla TS):
- Echo Show–style frame: dark bezel, large clock idle screen, blue listening light bar.
- Big mic button → Web Speech API recognition (lang hi-IN, fallback en-IN); show live transcript.
  Also a hidden "demo mode" text box + 3 preset buttons (digital arrest, grandparent scam, benign) so recording
  never depends on speech recognition.
- Speak replies with speechSynthesis, choosing a hi-IN voice when the reply contains Hindi.
- Render MCP Apps cards using @modelcontextprotocol/ext-apps/app-bridge (follow examples/basic-host).
  Fallback if app-bridge integration is blocked: render the card's HTML in a sandboxed iframe and post the
  tool result into it — note the fallback in docs/friction-log.md.
- Small collapsible "developer panel" showing tool calls in order (judges like seeing the MCP calls).

E2E manual script in packages/simulator/DEMO.md:
1. Benign preset → low risk, normal friendly answer.
2. Digital arrest preset → critical card → guidance spoken → verification sent → (tap I'm safe on dashboard)
   → verified card → "Rahul is safe. Please end the call. You can report at 1930."
3. Grandparent scam preset (en-US) → same engine catches it.
Commit "phase-5: simulator".
```

**Accept:** all 3 DEMO.md scenarios run 3 times in a row without errors.

---

## P6 — Deploy + end-to-end (Oct 23 morning)

```
Read CLAUDE.md and PLAN.md. Execute Phase 6.
- Deploy packages/server (MCP + dashboard) and packages/simulator as two web services on Render
  (or Railway/Fly if Render blocks — pick whichever works first; document it). Use env vars, no secrets in repo.
- Fallback if hosting fails: run locally and expose with a Cloudflare quick tunnel; document the command.
- Verify the deployed /mcp endpoint with MCP Inspector and with `claude mcp add --transport http guardian <url>/mcp`.
- Run DEMO.md against the deployed URLs.
- Root README.md: one-paragraph pitch, architecture diagram (mermaid), the 6 tools with descriptions,
  MCP spec version + transport, how to run locally (copy-paste commands), deployed URLs, risk-engine formula,
  test summary (cases caught / false positives), dignity & privacy design, limitations (simulator, mocked contact
  channel, rules not ML), what's next (real Alexa+ for Builders MCP Toolkit, SMS/WhatsApp channel, more languages).
Commit "phase-6: deploy + docs".
```

**Accept:** fresh browser, deployed URLs only, full demo works.

---

## P7 — Submission pack (Oct 23, you lead; Claude Code / OpenCode drafts)

- [ ] `docs/feedback.md` — product feedback on every tool/SDK used (MCP SDK v2, ext-apps, Alexa+ docs, hosting): what you used it for, what worked, what needs work, onboarding, would you build again. Draft with OpenCode from friction-log.md, then edit in your own words.
- [ ] `docs/friction-log.md` cleaned up (task, steps, expected vs actual, severity, workaround, suggestion) — up to 10% bonus.
- [ ] Feature requests (optional field): e.g. Alexa+ MCP sandbox for individual devs, Hindi voice in simulator tooling.
- [ ] Video script `docs/video-script.md` (≤ 2:50):
  - 0:00–0:15 hook: verified ₹1,935 crore stat + "an arrest that doesn't legally exist"
  - 0:15–1:30 digital-arrest scenario in simulator (critical card → calm guidance → verification → Rahul taps safe → verified card)
  - 1:30–1:50 same engine catches US grandparent voice-clone scam
  - 1:50–2:20 how it works: MCP server, 6 tools, explainable typology engine, test results, MCP Apps cards
  - 2:20–2:45 dignity-first design + impact + what's next
- [ ] Record with OBS (screen + voiceover). Two windows side by side: simulator + dashboard. No copyrighted music.
- [ ] Upload to YouTube (public or unlisted-but-public-link per rules: must be public), English.
- [ ] Repo: public with LICENSE, **or** private + add knmeiss, giolaq, anishamalde, mosesroth, emersonsklar as collaborators.
- [ ] Devpost form: description, repo URL, video URL, track = Alexa+, mini challenge = Open Source (see below), feedback, friction log.
- [ ] **Submit by 10:00 PM IST.** Then check the submission page renders correctly.

### Optional (only if ahead of schedule)
- **Open Source mini challenge:** rules ask for a *new, additional* open-source project or a contribution. Cleanest:
  publish `packages/risk-engine` as its own public repo `scam-typology-engine` (MIT) with README + tests. Fill the
  required fields: contribution URL, repo URL, GitHub username, what/how/why.
- **AWS Builder mini challenge:** only if you already have an AWS account with Bedrock access — swap the simulator's
  LLM to Bedrock and document it. Hackathon credit codes are no longer available.
- `check_family_code_word` tool (store a salted hash, never the word) for the US grandparent scenario.

---

## Tool split (avoid agents colliding)
- **Claude Code (Orca):** every phase above — it owns correctness.
- **agy / Gemini:** dashboard and card *visual polish* only, in their own folders, after the logic phase is committed.
- **OpenCode + DeepSeek:** extra test cases for the risk engine (review them yourself), README/feedback drafts.
- Never run two agents on the same folder at the same time. Commit before switching agents.
