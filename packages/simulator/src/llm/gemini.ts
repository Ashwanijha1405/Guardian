import type { CreateSession, LlmReply } from "./types.js";

interface Part {
  text?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  [key: string]: unknown;
}
interface Content {
  role: "user" | "model";
  parts: Part[];
}

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export const createGeminiSession: CreateSession = ({ system, tools, history }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env");
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

  const contents: Content[] = history.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.text }] }));
  const declarations = tools.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: t.inputSchema }));

  async function request() {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools: [{ functionDeclarations: declarations }],
        generationConfig: { temperature: 0.3 },
      }),
    });
    const body = (await res.json()) as { candidates?: Array<{ content?: Content }>; error?: { message: string } };
    return { res, body };
  }

  async function generate(): Promise<LlmReply> {
    let { res, body } = await request();
    // Free-tier keys allow only a few requests per minute; Gemini says how long to wait, so wait once and retry.
    for (let attempt = 0; res.status === 429 && attempt < 2; attempt++) {
      const wait = Number(/retry in ([\d.]+)s/.exec(body.error?.message ?? "")?.[1] ?? 20);
      if (wait > 60) break;
      await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
      ({ res, body } = await request());
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${body.error?.message ?? "request failed"}`);
    const content = body.candidates?.[0]?.content ?? { role: "model", parts: [] };
    // Sent back verbatim: Gemini 3 attaches thought signatures to these parts and rejects history without them.
    contents.push({ role: "model", parts: content.parts ?? [] });
    const parts = content.parts ?? [];
    return {
      text: parts.map((p) => p.text ?? "").join("").trim(),
      toolCalls: parts
        .filter((p) => p.functionCall)
        .map((p, i) => ({ id: p.functionCall!.id ?? `call-${contents.length}-${i}`, name: p.functionCall!.name, args: p.functionCall!.args ?? {} })),
    };
  }

  return {
    send(input) {
      if ("text" in input) {
        contents.push({ role: "user", parts: [{ text: input.text }] });
      } else {
        contents.push({
          role: "user",
          parts: input.toolResults.map((r) => ({ functionResponse: { id: r.id, name: r.name, response: r.result } })),
        });
      }
      return generate();
    },
  };
};
