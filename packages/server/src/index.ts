import { createApp } from "./app.js";
import { prebuildCards } from "./cards.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
// Render sets RENDER_EXTERNAL_HOSTNAME; elsewhere list public hostnames in ALLOWED_HOSTS (comma-separated).
const allowedHosts = [
  ...(process.env.ALLOWED_HOSTS ?? "").split(","),
  process.env.RENDER_EXTERNAL_HOSTNAME ?? "",
].map((h) => h.trim()).filter(Boolean);

void prebuildCards().catch((err) => console.error("Card build failed:", err));

createApp({ host, corsOrigin, allowedHosts: allowedHosts.length ? [...allowedHosts, "localhost", "127.0.0.1"] : undefined }).listen(port, host, () => {
  console.log(`Guardian MCP server on http://${host}:${port}/mcp`);
});
