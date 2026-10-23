import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let http: Server;
let port: number;

beforeAll(async () => {
  // Bound like a cloud deploy: all interfaces, with the public hostname allow-listed.
  http = createApp({ host: "0.0.0.0", corsOrigin: "http://localhost:5173", allowedHosts: ["guardian.example.com"] }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => http.once("listening", resolve));
  port = (http.address() as AddressInfo).port;
});

afterAll(() => {
  http.close();
});

// fetch() won't let us set Host, so use node:http directly.
function get(path: string, host: string, method = "GET"): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = request({ port, path, method, headers: { Host: host, "Content-Type": "application/json", Accept: "application/json, text/event-stream" } }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.end(method === "POST" ? JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) : undefined);
  });
}

describe("public deploy host checks", () => {
  it("rejects /mcp from an unknown Host (DNS rebinding protection)", async () => {
    expect(await get("/mcp", "evil.example.net", "POST")).toBe(403);
  });

  it("accepts /mcp from the allow-listed public hostname", async () => {
    expect(await get("/mcp", "guardian.example.com", "POST")).not.toBe(403);
  });

  it("keeps /health and /dashboard reachable for platform health checks", async () => {
    expect(await get("/health", "10.0.0.5:10000")).toBe(200);
    expect(await get("/dashboard/", "10.0.0.5:10000")).toBe(200);
  });
});
