import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RESOURCE_MIME_TYPE, registerAppResource } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { build } from "esbuild";

// Card sources sit beside src/ and dist/, so the same relative path works for tsx and the built server.
const CARDS_DIR = fileURLToPath(new URL("../cards/", import.meta.url));

export const RISK_CARD_URI = "ui://guardian/risk-card";
export const VERIFIED_CARD_URI = "ui://guardian/verified-card";

const CARDS = [
  { uri: RISK_CARD_URI, name: "Guardian risk card", entry: "risk-card.ts", description: "Score dial, scam pattern, red flags with evidence, and the recommended action." },
  { uri: VERIFIED_CARD_URI, name: "Guardian verification card", entry: "verified-card.ts", description: "Whether the family member confirmed it is a scam, asked for help, or did not answer." },
];

/**
 * Bundles a card's script (ext-apps App class included) and inlines it with the CSS into one HTML string.
 * The host renders it in a sandboxed iframe with no network access, so nothing may be loaded from outside.
 */
async function buildCard(entry: string, title: string): Promise<string> {
  const [bundle, template, css] = await Promise.all([
    build({ entryPoints: [CARDS_DIR + entry], bundle: true, format: "iife", minify: true, write: false, target: "es2020" }),
    readFile(CARDS_DIR + "template.html", "utf8"),
    readFile(CARDS_DIR + "card.css", "utf8"),
  ]);
  // A literal "</script" inside the bundle would end the inline <script> early.
  const script = bundle.outputFiles[0]!.text.replaceAll("</script", "<\\/script");
  // Function replacers: the bundle contains "$&"-style sequences that string replacement would expand.
  return template
    .replace("{{TITLE}}", () => title)
    .replace("{{STYLE}}", () => css)
    .replace("{{SCRIPT}}", () => script);
}

// Built once per process and shared, because the stateless server creates a new McpServer per request.
const cache = new Map<string, Promise<string>>();
function cardHtml(entry: string, title: string): Promise<string> {
  if (!cache.has(entry)) cache.set(entry, buildCard(entry, title));
  return cache.get(entry)!;
}

export function registerCards(server: McpServer): void {
  for (const card of CARDS) {
    registerAppResource(server, card.name, card.uri, { description: card.description }, async () => ({
      contents: [{ uri: card.uri, mimeType: RESOURCE_MIME_TYPE, text: await cardHtml(card.entry, card.name) }],
    }));
  }
}

/** Warms the cache at startup so the first tool call on stage doesn't wait for esbuild. */
export function prebuildCards(): Promise<unknown> {
  return Promise.all(CARDS.map((c) => cardHtml(c.entry, c.name)));
}
