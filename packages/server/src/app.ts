import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import cors from "cors";
import type { Express } from "express";
import { createGuardianServer } from "./server.js";

export interface AppOptions {
  host: string;
  corsOrigin: string;
}

export function createApp({ host, corsOrigin }: AppOptions): Express {
  const app = createMcpExpressApp({ host });
  app.use(cors({ origin: corsOrigin.split(","), exposedHeaders: ["Mcp-Session-Id"] }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, name: "guardian" });
  });

  // Stateless: a fresh server + transport per request, so there is no session state to lose on restart.
  app.post("/mcp", async (req, res) => {
    const server = createGuardianServer();
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}
