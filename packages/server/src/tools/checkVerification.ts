import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { VERIFIED_CARD_URI } from "../cards.js";
import { household } from "../data.js";
import { getVerification, type VerificationStatus } from "../verifications.js";
import { localeSchema } from "./schemas.js";

// Where to report depends on the country of the conversation: India's cybercrime helpline, or the FBI's IC3 in the US.
const reportAt = (locale: string) => (locale === "en-US" ? "ic3.gov" : "1930");

type Line = (name: string, report: string) => string;
const LINES: Record<VerificationStatus, { en: Line; hi: Line }> = {
  pending: {
    en: (n) => `Still waiting for ${n}. Please stay calm and don't send any money.`,
    hi: (n) => `${n} ke jawab ka intezaar hai. Ghabraiye mat, aur paise mat bhejiye.`,
  },
  confirmed_safe: {
    en: (n, r) => `${n} confirmed everything is fine, so this call is a scam. Please end the call now. You can report it at ${r}.`,
    hi: (n, r) => `${n} ne confirm kiya ki sab theek hai, yeh call dhokha hai. Abhi call kaat dijiye. Aap ${r} par shikayat kar sakti hain.`,
  },
  needs_help: {
    en: (n) => `${n} replied that they do need help. Still, please don't pay this caller. End the call, and ${n} or the family will call you directly.`,
    hi: (n) => `${n} ne bataya ki unhe madad chahiye. Phir bhi is caller ko paise mat dijiye. Call kaat dijiye, ${n} ya parivaar aapko seedha call karenge.`,
  },
  no_response: {
    en: (n, r) => `${n} hasn't answered yet. Please end the call and don't pay anything. If you feel unsafe, report it at ${r}.`,
    hi: (n, r) => `${n} ne abhi jawab nahi diya. Call kaat dijiye aur kuch bhi pay mat kijiye. Darr lage to ${r} par call kijiye.`,
  },
};

export function registerCheckVerification(server: McpServer): void {
  registerAppTool(
    server,
    "check_verification",
    {
      title: "Check verification",
      description:
        "Check whether the family member answered a verify_with_family request. Status is pending, confirmed_safe, " +
        "needs_help, or no_response (no answer after 90 seconds). Speak `say` to the user as-is.",
      inputSchema: z.object({ request_id: z.string().min(1), locale: localeSchema }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: VERIFIED_CARD_URI } },
    },
    async ({ request_id, locale }) => {
      const req = getVerification(request_id);
      if (!req) {
        return { isError: true, content: [{ type: "text", text: `No verification request with id ${request_id}.` }] };
      }
      // An explicit locale wins; otherwise answer in the language the request was raised in.
      const userLocale = locale ?? req.locale ?? household.locale;
      const lang = userLocale.startsWith("hi") ? "hi" : "en";
      const say = LINES[req.status][lang](req.contactName, reportAt(userLocale));
      const structuredContent = { request_id: req.id, contact_name: req.contactName, status: req.status, locale: userLocale, say };
      return { content: [{ type: "text", text: say }], structuredContent };
    },
  );
}
