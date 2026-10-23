import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let http: Server;
let base: string;
let client: Client;

beforeAll(async () => {
  http = createApp({ host: "127.0.0.1", corsOrigin: "http://localhost:5173" }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => http.once("listening", resolve));
  base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  client = new Client({ name: "guardian-test", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
});

afterAll(async () => {
  await client.close();
  http.closeAllConnections();
  http.close();
});

interface VerificationResult {
  request_id: string;
  contact_name: string;
  status: string;
  say: string;
}

async function verify(): Promise<VerificationResult> {
  const result = await client.callTool({
    name: "verify_with_family",
    arguments: { reason: "Someone claiming to be CBI says Dadi is under digital arrest.", claimed_person: "CBI officer", typology: "digital_arrest", locale: "en-IN" },
  });
  return result.structuredContent as unknown as VerificationResult;
}

async function check(id: string, locale = "en-IN"): Promise<VerificationResult> {
  const result = await client.callTool({ name: "check_verification", arguments: { request_id: id, locale } });
  return result.structuredContent as unknown as VerificationResult;
}

function respond(id: string, status: string) {
  return fetch(`${base}/verifications/${id}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

describe("family verification loop", () => {
  it("goes pending → confirmed_safe after the family taps I'm safe", async () => {
    const req = await verify();
    expect(req).toMatchObject({ contact_name: "Rahul", status: "pending" });
    expect((await check(req.request_id)).status).toBe("pending");

    expect((await respond(req.request_id, "confirmed_safe")).status).toBe(200);

    const after = await check(req.request_id, "hi-IN");
    expect(after.status).toBe("confirmed_safe");
    expect(after.say).toMatch(/1930/);
  });

  it("answers in the request's language and country when the check omits a locale", async () => {
    const created = await client.callTool({
      name: "verify_with_family",
      arguments: { reason: "A caller who sounds like Rahul says he is in jail.", typology: "grandparent_voice_clone", locale: "en-US" },
    });
    const id = (created.structuredContent as unknown as VerificationResult).request_id;
    await respond(id, "confirmed_safe");

    const result = await client.callTool({ name: "check_verification", arguments: { request_id: id } });
    const after = result.structuredContent as unknown as VerificationResult & { locale: string };
    expect(after.locale).toBe("en-US");
    expect(after.say).toMatch(/^Rahul confirmed/);
    expect(after.say).toMatch(/ic3\.gov/);
    expect(after.say).not.toMatch(/1930/);
  });

  it("reports needs_help", async () => {
    const req = await verify();
    await respond(req.request_id, "needs_help");
    expect((await check(req.request_id)).status).toBe("needs_help");
  });

  it("times out to no_response", async () => {
    process.env.VERIFICATION_TIMEOUT_MS = "50";
    try {
      const req = await verify();
      await new Promise((r) => setTimeout(r, 80));
      expect((await check(req.request_id)).status).toBe("no_response");
    } finally {
      delete process.env.VERIFICATION_TIMEOUT_MS;
    }
  });

  it("rejects bad respond requests", async () => {
    const req = await verify();
    expect((await respond(req.request_id, "maybe")).status).toBe(400);
    expect((await respond("does-not-exist", "confirmed_safe")).status).toBe(404);
  });

  it("returns a tool error for an unknown request id", async () => {
    const result = await client.callTool({ name: "check_verification", arguments: { request_id: "nope" } });
    expect(result.isError).toBe(true);
  });

  it("streams a snapshot, then live verification and alert events over SSE", async () => {
    const res = await fetch(`${base}/events/stream`);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    const waitFor = async (pattern: RegExp) => {
      while (!pattern.test(buffer)) {
        const { value, done } = await reader.read();
        if (done) throw new Error(`stream ended before ${pattern}`);
        buffer += value;
      }
    };

    await waitFor(/event: snapshot/);
    expect(buffer).not.toMatch(/phone/);

    const req = await verify();
    await waitFor(new RegExp(`event: verification\\ndata: .*${req.request_id}`));

    await client.callTool({ name: "notify_family", arguments: { summary: "SSE test alert.", severity: "warning" } });
    await waitFor(/event: alert\ndata: .*SSE test alert/);

    await reader.cancel();
  });
});
