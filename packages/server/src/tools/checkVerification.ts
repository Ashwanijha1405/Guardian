import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { household } from "../data.js";
import { getVerification, type VerificationStatus } from "../verifications.js";
import { localeSchema } from "./schemas.js";

const LINES: Record<VerificationStatus, { en: (name: string) => string; hi: (name: string) => string }> = {
  pending: {
    en: (n) => `Still waiting for ${n}. Please stay calm and don't send any money.`,
    hi: (n) => `${n} ke jawab ka intezaar hai. Ghabraiye mat, aur paise mat bhejiye.`,
  },
  confirmed_safe: {
    en: (n) => `${n} confirmed everything is fine, so this call is a scam. Please end the call now. You can report it at 1930.`,
    hi: (n) => `${n} ne bataya ki wo bilkul theek hain aur yeh dhokha hai. Abhi call kaat dijiye. Aap 1930 par shikayat kar sakti hain.`,
  },
  needs_help: {
    en: (n) => `${n} replied that they do need help. Still, please don't pay this caller. End the call, and ${n} or the family will call you directly.`,
    hi: (n) => `${n} ne bataya ki unhe madad chahiye. Phir bhi is caller ko paise mat dijiye. Call kaat dijiye, ${n} ya parivaar aapko seedha call karenge.`,
  },
  no_response: {
    en: (n) => `${n} hasn't answered yet. Please end the call and don't pay anything. If you feel unsafe, call 1930.`,
    hi: (n) => `${n} ne abhi jawab nahi diya. Call kaat dijiye aur kuch bhi pay mat kijiye. Darr lage to 1930 par call kijiye.`,
  },
};

export function registerCheckVerification(server: McpServer): void {
  server.registerTool(
    "check_verification",
    {
      title: "Check verification",
      description:
        "Check whether the family member answered a verify_with_family request. Status is pending, confirmed_safe, " +
        "needs_help, or no_response (no answer after 90 seconds). Speak `say` to the user as-is.",
      inputSchema: z.object({ request_id: z.string().min(1), locale: localeSchema }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ request_id, locale }) => {
      const req = getVerification(request_id);
      if (!req) {
        return { isError: true, content: [{ type: "text", text: `No verification request with id ${request_id}.` }] };
      }
      const lang = (locale ?? household.locale).startsWith("hi") ? "hi" : "en";
      const say = LINES[req.status][lang](req.contactName);
      const structuredContent = { request_id: req.id, contact_name: req.contactName, status: req.status, say };
      return { content: [{ type: "text", text: say }], structuredContent };
    },
  );
}
