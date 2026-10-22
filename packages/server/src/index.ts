import { createApp } from "./app.js";
import { prebuildCards } from "./cards.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

void prebuildCards().catch((err) => console.error("Card build failed:", err));

createApp({ host, corsOrigin }).listen(port, host, () => {
  console.log(`Guardian MCP server on http://${host}:${port}/mcp`);
});
