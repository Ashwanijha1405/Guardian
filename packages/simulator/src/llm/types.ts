export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: Record<string, unknown>;
}

export interface LlmReply {
  text: string;
  toolCalls: ToolCall[];
}

export interface HistoryTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * One conversation turn with a model. Each provider keeps its own native message history inside the session,
 * because some providers (Gemini 3) require their own response parts to be sent back unchanged.
 */
export interface LlmSession {
  send(input: { text: string } | { toolResults: ToolResult[] }): Promise<LlmReply>;
}

export type CreateSession = (opts: { system: string; tools: ToolSpec[]; history: HistoryTurn[] }) => LlmSession;
