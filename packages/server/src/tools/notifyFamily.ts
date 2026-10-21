import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { addEvent } from "../events.js";

export function registerNotifyFamily(server: McpServer): void {
  server.registerTool(
    "notify_family",
    {
      title: "Notify family",
      description:
        "Send an alert to the household's trusted family contact (shown on their dashboard). Write a one-line summary " +
        "of what is happening, never the raw conversation. Use after assess_scam_risk returns band high or critical.",
      inputSchema: z.object({
        summary: z
          .string()
          .min(1)
          .max(280)
          .describe("One plain sentence, e.g. 'Someone claiming to be CBI says Dadi is under digital arrest.'"),
        severity: z.enum(["info", "warning", "critical"]),
        typology: z.string().optional(),
        score: z.number().min(0).max(100).optional(),
      }),
      annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (input) => {
      const event = addEvent(input);
      return {
        content: [{ type: "text", text: `Family notified (event ${event.id}).` }],
        structuredContent: { eventId: event.id, createdAt: event.createdAt },
      };
    },
  );
}
