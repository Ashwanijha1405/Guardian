import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import cors from "cors";
import express, { type Express } from "express";
import { fileURLToPath } from "node:url";

// Static files sit beside src/ and dist/, so the same relative path works for tsx and the built server.
const DASHBOARD_DIR = fileURLToPath(new URL("../dashboard/", import.meta.url));
import { familyRoutes } from "./familyRoutes.js";
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
  app.use(familyRoutes());
  app.use("/dashboard", express.static(DASHBOARD_DIR));

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
