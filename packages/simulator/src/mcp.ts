import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";
import { env } from "./env.js";

export interface GuardianTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  uiResourceUri?: string;
}

export interface ToolOutcome {
  isError: boolean;
  text: string;
  structuredContent?: Record<string, unknown>;
  /** The raw MCP CallToolResult, forwarded unchanged to the MCP Apps card. */
  raw: unknown;
}

/** The simulator's MCP client to Guardian: the "Alexa+" side of the MCP connection. */
export class GuardianConnection {
  private client: Client | null = null;
  private tools: GuardianTool[] = [];
  private instructions = "";
  private uiCache = new Map<string, string>();

  async connect(): Promise<void> {
    const client = new Client({ name: "alexa-plus-simulator", version: "0.1.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(env.guardianMcpUrl)));
    const { tools } = await client.listTools();
    this.tools = tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema as Record<string, unknown>,
      uiResourceUri: getToolUiResourceUri(t),
    }));
    this.instructions = client.getInstructions() ?? "";
    this.client = client;
  }

  /** Connects on first use and again after a failure, so a Guardian restart doesn't need a simulator restart. */
  private async ready(): Promise<Client> {
    if (!this.client) await this.connect();
    return this.client!;
  }

  async describe(): Promise<{ tools: GuardianTool[]; instructions: string; protocolVersion?: string }> {
    const client = await this.ready();
    return { tools: this.tools, instructions: this.instructions, protocolVersion: client.getNegotiatedProtocolVersion() };
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    try {
      return await this.callOnce(name, args);
    } catch {
      // The client validates results against the tool schemas it listed at connect time. After Guardian restarts
      // or is redeployed with new schemas, that cache is stale: reconnect (re-list tools) and retry once.
      this.client = null;
      this.uiCache.clear();
      return this.callOnce(name, args);
    }
  }

  private async callOnce(name: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    const raw = await (await this.ready()).callTool({ name, arguments: args });
    const text = (raw.content as Array<{ type: string; text?: string }>)
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    return { isError: Boolean(raw.isError), text, structuredContent: raw.structuredContent as Record<string, unknown>, raw };
  }

  /** Card HTML is static per URI, so it is fetched once and reused for every tool call. */
  async uiResource(uri: string): Promise<string> {
    const cached = env.production ? this.uiCache.get(uri) : undefined;
    if (cached) return cached;
    const { contents } = await (await this.ready()).readResource({ uri });
    const html = (contents[0] as { text?: string }).text ?? "";
    this.uiCache.set(uri, html);
    return html;
  }
}
