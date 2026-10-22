import { fileURLToPath } from "node:url";

// Keys live only in the repo-root .env (gitignored). In hosted deploys the platform sets env vars instead.
try {
  process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));
} catch {
  // No .env file: rely on the process environment.
}

export const env = {
  port: Number(process.env.SIMULATOR_PORT ?? 5173),
  guardianMcpUrl: process.env.GUARDIAN_MCP_URL ?? "http://localhost:3000/mcp",
  provider: (process.env.LLM_PROVIDER ?? "gemini") as "gemini" | "anthropic" | "openai",
  production: process.env.NODE_ENV === "production",
};
