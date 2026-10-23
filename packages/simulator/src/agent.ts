import { env } from "./env.js";
import { sessionFactory, type HistoryTurn, type ToolCall, type ToolResult } from "./llm/index.js";
import type { GuardianConnection, ToolOutcome } from "./mcp.js";

/** Events streamed to the frontend over SSE, in the order they happen. */
export type TurnEvent =
  | { type: "transcript"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string; isError: boolean }
  | { type: "ui_resource"; uri: string; html: string; toolInput: Record<string, unknown>; toolResult: unknown }
  | { type: "waiting"; contact: string; seconds: number }
  | { type: "assistant_text"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

const SYSTEM = `You are Alexa+, speaking through an Echo Show to an elderly Indian woman called Dadi who lives alone.
- Reply in the language she used: Hindi, Hinglish (Hindi in Roman script) or English. Hindi replies are written in Roman script so the voice reads them naturally.
- At most 2-3 short sentences. Calm, warm, firm. Never shame or scold her.
- Follow the Guardian server instructions below exactly. Never invent safety facts, phone numbers or laws: use get_safety_guidance and speak its "say" field.
- When a tool returns a "say" field, base your reply on it.
- If a tool result has "already_said_to_user": true, Dadi has already heard that "say" text. Do not repeat it; add only what is new.
- If nothing is wrong, just answer like a friendly assistant.`;

// Dadi tapped the screen because the "officer" may be watching her on video: she reads, she does not listen.
const QUIET = `QUIET MODE: Dadi asked by tapping the screen, silently, because the caller may be watching or listening.
She will READ your reply on screen; it is not spoken. Write in simple Hindi in Devanagari script (English only if her
message is in English), at most 2 short sentences. Never ask her to say anything out loud.`;

const MAX_STEPS = 8;
const POLL_EVERY_MS = 3_000;
// Slightly longer than the server's 90 s timeout so the final no_response is observed, not guessed.
const POLL_LIMIT_MS = 95_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function summarize(name: string, outcome: ToolOutcome): string {
  const sc = outcome.structuredContent ?? {};
  if (name === "assess_scam_risk") return `${sc.score}/100 · ${sc.band} · ${sc.typology}`;
  if (name === "check_verification" || name === "verify_with_family") return String(sc.status ?? "");
  if (name === "notify_family") return "family alerted";
  return outcome.text.slice(0, 80);
}

export class Agent {
  constructor(private guardian: GuardianConnection) {}

  async runTurn(
    text: string,
    history: HistoryTurn[],
    emit: (e: TurnEvent) => void,
    signal: AbortSignal,
    { quiet = false }: { quiet?: boolean } = {},
  ): Promise<void> {
    emit({ type: "transcript", text });
    const { tools, instructions } = await this.guardian.describe();
    const session = sessionFactory(env.provider)({
      system: `${SYSTEM}${quiet ? `\n\n${QUIET}` : ""}\n\nGuardian server instructions:\n${instructions}`,
      tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      history,
    });

    let pendingVerification: string | null = null;
    let checked = false;
    let reply = await session.send({ text });

    for (let step = 0; step < MAX_STEPS && !signal.aborted; step++) {
      if (reply.text) emit({ type: "assistant_text", text: reply.text });

      if (reply.toolCalls.length === 0) {
        // The model announced it is asking the family but never checked back: poll on its behalf, then let it speak.
        if (!pendingVerification || checked) break;
        checked = true;
        const result = await this.runTool({ id: "auto-check", name: "check_verification", args: { request_id: pendingVerification } }, emit, signal);
        reply = await session.send({ text: `[Guardian] check_verification result: ${JSON.stringify(result.result)}. Tell Dadi now.` });
        continue;
      }

      const results: ToolResult[] = [];
      for (const call of reply.toolCalls) {
        const result = await this.runTool(call, emit, signal);
        if (call.name === "verify_with_family" && typeof result.result.request_id === "string") pendingVerification = result.result.request_id;
        if (call.name === "check_verification") checked = true;
        results.push(result);
      }
      reply = await session.send({ toolResults: results });
    }
  }

  private async runTool(call: ToolCall, emit: (e: TurnEvent) => void, signal: AbortSignal): Promise<ToolResult> {
    emit({ type: "tool_call", name: call.name, args: call.args });
    let outcome = await this.guardian.callTool(call.name, call.args);

    // The family answers on their own phone, so a pending check is polled here instead of making the model loop.
    if (call.name === "check_verification" && !outcome.isError) {
      const started = Date.now();
      while (outcome.structuredContent?.status === "pending" && Date.now() - started < POLL_LIMIT_MS && !signal.aborted) {
        emit({ type: "waiting", contact: String(outcome.structuredContent.contact_name ?? "family"), seconds: Math.round((Date.now() - started) / 1000) });
        await sleep(POLL_EVERY_MS);
        outcome = await this.guardian.callTool(call.name, call.args);
      }
    }

    emit({ type: "tool_result", name: call.name, summary: summarize(call.name, outcome), isError: outcome.isError });
    // Safety facts must reach Dadi verbatim from Guardian's sourced data, so they are said here rather than
    // left to the model, which sometimes skipped them in testing.
    const guidance = call.name === "get_safety_guidance" && !outcome.isError ? outcome.structuredContent?.say : undefined;
    if (typeof guidance === "string" && guidance) emit({ type: "assistant_text", text: guidance });
    const uri = (await this.guardian.describe()).tools.find((t) => t.name === call.name)?.uiResourceUri;
    if (uri && !outcome.isError) {
      emit({ type: "ui_resource", uri, html: await this.guardian.uiResource(uri), toolInput: call.args, toolResult: outcome.raw });
    }
    const result = { ...(outcome.structuredContent ?? { text: outcome.text }), ...(guidance ? { already_said_to_user: true } : {}) };
    return { id: call.id, name: call.name, result: outcome.isError ? { error: outcome.text } : result };
  }
}
