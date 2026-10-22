import type { CreateSession, LlmReply } from "./types.js";

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };
interface Message {
  role: "user" | "assistant";
  content: string | Block[];
}

export const createAnthropicSession: CreateSession = ({ system, tools, history }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

  const messages: Message[] = history.map((t) => ({ role: t.role, content: t.text }));
  const toolDefs = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));

  async function generate(): Promise<LlmReply> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1024, system, tools: toolDefs, messages }),
    });
    const body = (await res.json()) as { content?: Block[]; error?: { message: string } };
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${body.error?.message ?? "request failed"}`);
    const content = body.content ?? [];
    messages.push({ role: "assistant", content });
    return {
      text: content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim(),
      toolCalls: content.flatMap((b) => (b.type === "tool_use" ? [{ id: b.id, name: b.name, args: b.input }] : [])),
    };
  }

  return {
    send(input) {
      if ("text" in input) {
        messages.push({ role: "user", content: input.text });
      } else {
        messages.push({
          role: "user",
          content: input.toolResults.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: JSON.stringify(r.result) })),
        });
      }
      return generate();
    },
  };
};
