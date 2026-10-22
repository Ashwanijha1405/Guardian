import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

let current: { bridge: AppBridge; iframe: HTMLIFrameElement } | null = null;

/**
 * Renders an MCP Apps card (a ui:// resource) the way an MCP Apps host does: a sandboxed iframe plus an AppBridge
 * that hands the card its tool input and result. The card cannot reach the network, the page, or Guardian.
 */
export async function showCard(slot: HTMLElement, html: string, toolInput: Record<string, unknown>, toolResult: unknown): Promise<void> {
  await clearCard(slot);
  slot.hidden = false;

  const iframe = document.createElement("iframe");
  iframe.sandbox.add("allow-scripts");
  iframe.title = "Guardian card";
  iframe.srcdoc = html;
  slot.replaceChildren(iframe);

  // No MCP client: the cards only display results and never call tools back through the host.
  const bridge = new AppBridge(null, { name: "Alexa+ simulator", version: "0.1.0" }, {});
  bridge.oninitialized = () => {
    void bridge.sendToolInput({ arguments: toolInput });
    void bridge.sendToolResult(toolResult as Parameters<AppBridge["sendToolResult"]>[0]);
  };
  current = { bridge, iframe };
  await bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!));
}

export async function clearCard(slot: HTMLElement): Promise<void> {
  if (current) {
    // Best effort: a card that never finished loading cannot answer the teardown request.
    await Promise.race([current.bridge.teardownResource({}).catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
    await current.bridge.close().catch(() => {});
    current = null;
  }
  slot.replaceChildren();
  slot.hidden = true;
}
