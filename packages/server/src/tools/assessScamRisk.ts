import { assessRisk, type Locale } from "@guardian/risk-engine";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { household } from "../data.js";
import { localeSchema, riskAssessmentSchema } from "./schemas.js";

export function registerAssessScamRisk(server: McpServer): void {
  server.registerTool(
    "assess_scam_risk",
    {
      title: "Assess scam risk",
      description:
        "Score how likely a call or message the user describes is a scam (digital arrest, fake RBI safe account, " +
        "courier/narcotics parcel, grandparent emergency, US IRS/FBI). Pass the user's own words. Returns a 0-100 score, " +
        "band, matched scam pattern, every red flag with the exact phrase that triggered it, and a recommended action. " +
        "Call this FIRST whenever the user mentions money, police, arrest, secrecy, a parcel, or a relative in trouble.",
      inputSchema: z.object({
        situation: z.string().min(1).describe("What the user said about the call or message, verbatim if possible."),
        locale: localeSchema,
      }),
      outputSchema: riskAssessmentSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ situation, locale }) => {
      const result = assessRisk({ text: situation, locale: locale ?? (household.locale as Locale) });
      const text =
        `Risk ${result.score}/100 (${result.band}), pattern: ${result.typology}. ` +
        `${result.explanation} Recommended: ${result.recommendedAction}.`;
      return { content: [{ type: "text", text }], structuredContent: result };
    },
  );
}
