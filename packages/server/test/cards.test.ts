import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let http: Server;
let client: Client;

beforeAll(async () => {
  http = createApp({ host: "127.0.0.1", corsOrigin: "http://localhost:5173" }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => http.once("listening", resolve));
  client = new Client({ name: "guardian-test", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`)));
});

afterAll(async () => {
  await client.close();
  http.close();
});

const CARDS = { assess_scam_risk: "ui://guardian/risk-card", check_verification: "ui://guardian/verified-card" };

describe("MCP Apps cards", () => {
  it("links each card to its tool through _meta.ui.resourceUri", async () => {
    const { tools } = await client.listTools();
    for (const [tool, uri] of Object.entries(CARDS)) {
      const meta = tools.find((t) => t.name === tool)?._meta as { ui?: { resourceUri?: string } } | undefined;
      expect(meta?.ui?.resourceUri).toBe(uri);
    }
  });

  it("lists both cards as MCP Apps resources", async () => {
    const { resources } = await client.listResources();
    for (const uri of Object.values(CARDS)) {
      expect(resources.find((r) => r.uri === uri)?.mimeType).toBe("text/html;profile=mcp-app");
    }
  });

  it("serves self-contained HTML with the App bundle inlined and no external loads", { timeout: 30_000 }, async () => {
    for (const uri of Object.values(CARDS)) {
      const { contents } = await client.readResource({ uri });
      const html = (contents[0] as { text: string }).text;
      expect(html).toMatch(/^<!doctype html>/);
      expect(html).not.toMatch(/\{\{(TITLE|STYLE|SCRIPT)\}\}/);
      expect(html).toMatch(/ontoolresult|tool-result/);
      expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+href=|@import/);
    }
  });
});
