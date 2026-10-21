import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { household, safetyFacts } from "../data.js";
import { localeSchema, typologySchema } from "./schemas.js";

export function registerGetSafetyGuidance(server: McpServer): void {
  server.registerTool(
    "get_safety_guidance",
    {
      title: "Get safety guidance",
      description:
        "Get verified safety facts (each with a source URL), concrete next steps, and a short calm reply ready to speak " +
        "to the user in their language. Use the typology returned by assess_scam_risk. Speak `say` as-is; do not add facts of your own.",
      inputSchema: z.object({ typology: typologySchema, locale: localeSchema }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ typology, locale }) => {
      const guidance = safetyFacts.typologies[typology] ?? safetyFacts.general;
      const lang = (locale ?? household.locale).startsWith("hi") ? "hi" : "en";
      const facts = guidance.facts.slice(0, 3);
      const nextSteps = guidance.nextSteps.map((s) => s[lang]);
      // One fact + two steps keeps the spoken reply within 3 sentences.
      const say = [facts[0]?.[lang], ...nextSteps.slice(0, 2)].filter(Boolean).join(" ");
      const structuredContent = {
        typology,
        language: lang,
        say,
        facts: facts.map((f) => ({ text: f[lang], source: f.source, verified: f.verified })),
        nextSteps,
      };
      return { content: [{ type: "text", text: say }], structuredContent };
    },
  );
}
