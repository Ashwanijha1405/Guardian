import { createAnthropicSession } from "./anthropic.js";
import { createGeminiSession } from "./gemini.js";
import type { CreateSession } from "./types.js";

export function sessionFactory(provider: string): CreateSession {
  if (provider === "gemini") return createGeminiSession;
  if (provider === "anthropic") return createAnthropicSession;
  throw new Error(`LLM_PROVIDER "${provider}" is not supported yet. Use "gemini" or "anthropic".`);
}

export type * from "./types.js";
