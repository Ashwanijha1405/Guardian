import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const DEMO_A =
  "Alexa, ek CBI officer video call pe hai, bol raha hai main digital arrest mein hoon, kisi ko batana mat, aur paise RBI safe account mein bhejne ko bol raha hai";

let http: Server;
let client: Client;

beforeAll(async () => {
  http = createApp({ host: "127.0.0.1", corsOrigin: "http://localhost:5173" }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => http.once("listening", resolve));
  const { port } = http.address() as AddressInfo;
  client = new Client({ name: "guardian-test", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
});

afterAll(async () => {
  await client.close();
  http.close();
});

describe("guardian MCP server over Streamable HTTP", () => {
  it("negotiates a protocol version of 2025-11-25 or later and sends instructions", () => {
    expect(client.getServerVersion()?.name).toBe("guardian");
    // ISO dates compare correctly as strings.
    expect(client.getNegotiatedProtocolVersion()! >= "2025-11-25").toBe(true);
    expect(client.getInstructions()).toMatch(/assess_scam_risk first/);
  });

  it("lists the four tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "assess_scam_risk",
      "get_household_context",
      "get_safety_guidance",
      "notify_family",
    ]);
  });

  it("scores demo case A as critical digital arrest", async () => {
    const result = await client.callTool({ name: "assess_scam_risk", arguments: { situation: DEMO_A, locale: "hi-IN" } });
    expect(result.structuredContent).toMatchObject({ band: "critical", typology: "digital_arrest", recommendedAction: "end_call_now" });
  });

  it("returns sourced guidance with a Hindi reply", async () => {
    const result = await client.callTool({ name: "get_safety_guidance", arguments: { typology: "digital_arrest", locale: "hi-IN" } });
    const sc = result.structuredContent as { say: string; facts: Array<{ source: string }> };
    expect(sc.say).toMatch(/डिजिटल अरेस्ट/);
    expect(sc.facts.length).toBeGreaterThanOrEqual(2);
    for (const f of sc.facts) expect(f.source).toMatch(/^https:\/\//);
  });

  it("records a family notification", async () => {
    const result = await client.callTool({
      name: "notify_family",
      arguments: { summary: "Test alert from integration test.", severity: "info" },
    });
    expect((result.structuredContent as { eventId: string }).eventId).toMatch(/[0-9a-f-]{36}/);
  });

  it("returns household context without phone numbers", async () => {
    const result = await client.callTool({ name: "get_household_context", arguments: {} });
    expect(JSON.stringify(result.structuredContent)).not.toMatch(/phone/);
    expect(result.structuredContent).toMatchObject({ persona: { displayName: "Dadi" } });
  });

  it("rejects bad input with a tool error instead of crashing", async () => {
    const result = await client.callTool({ name: "notify_family", arguments: { summary: "", severity: "loud" } });
    expect(result.isError).toBe(true);
  });
});
