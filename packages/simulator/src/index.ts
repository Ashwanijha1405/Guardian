import { fileURLToPath } from "node:url";
import express from "express";
import { z } from "zod";
import { Agent, type TurnEvent } from "./agent.js";
import { env } from "./env.js";
import { GuardianConnection } from "./mcp.js";

const WEB_DIR = fileURLToPath(new URL("../web/", import.meta.url));

const turnBody = z.object({
  text: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .max(20)
    .default([]),
});

const guardian = new GuardianConnection();
const agent = new Agent(guardian);
const app = express();
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const { tools, protocolVersion } = await guardian.describe();
    res.json({ ok: true, provider: env.provider, guardian: env.guardianMcpUrl, protocolVersion, tools: tools.map((t) => t.name) });
  } catch (err) {
    res.status(503).json({ ok: false, error: `Cannot reach Guardian at ${env.guardianMcpUrl}: ${(err as Error).message}` });
  }
});

// One user utterance → a stream of events (tool calls, cards, waiting, spoken replies) until the agent is done.
app.post("/api/turn", async (req, res) => {
  const parsed = turnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Body must be { text: string, history?: [...] }" });
    return;
  }
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  const emit = (e: TurnEvent) => res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
  const abort = new AbortController();
  res.on("close", () => abort.abort());

  try {
    await agent.runTurn(parsed.data.text, parsed.data.history, emit, abort.signal);
  } catch (err) {
    console.error(err);
    emit({ type: "error", message: (err as Error).message });
  }
  emit({ type: "done" });
  res.end();
});

if (env.production) {
  app.use(express.static(fileURLToPath(new URL("../web-dist/", import.meta.url))));
} else {
  // Dev: Vite runs inside this process, so the page and /api share one origin and one port.
  const { createServer } = await import("vite");
  const vite = await createServer({ root: WEB_DIR, server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

app.listen(env.port, () => {
  console.log(`Alexa+ simulator on http://localhost:${env.port} (LLM: ${env.provider}, Guardian: ${env.guardianMcpUrl})`);
});
