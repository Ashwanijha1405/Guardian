import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { household } from "../data.js";
import { createVerification } from "../verifications.js";
import { localeSchema } from "./schemas.js";

export function registerVerifyWithFamily(server: McpServer): void {
  server.registerTool(
    "verify_with_family",
    {
      title: "Verify with family",
      description:
        "Ask the household's trusted family contact, on their own phone, whether a claim is real (e.g. 'your grandson is " +
        "in jail', or 'CBI says you are under digital arrest'). This is out-of-band verification through a known channel, " +
        "as the FBI advises. Returns a request_id and a line to speak while waiting. Then poll check_verification every few seconds.",
      inputSchema: z.object({
        reason: z
          .string()
          .min(1)
          .max(280)
          .describe("One-line summary for the family member, e.g. 'Someone claiming to be CBI says Dadi is under digital arrest.' Never the transcript."),
        claimed_person: z.string().optional().describe("Who the caller claims to be or claims is in trouble, e.g. 'CBI officer' or 'Rahul'."),
        typology: z.string().optional(),
        locale: localeSchema,
      }),
      annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ reason, claimed_person, typology, locale }) => {
      const contact = household.trustedContacts.find((c) => c.primary) ?? household.trustedContacts[0];
      if (!contact) {
        return { isError: true, content: [{ type: "text", text: "No trusted contact is configured for this household." }] };
      }
      const req = createVerification(contact, { reason, claimedPerson: claimed_person, typology });
      const hindi = (locale ?? household.locale).startsWith("hi");
      const say = hindi
        ? `Main abhi ${contact.name} se pooch rahi hoon. Tab tak kisi ko paise mat bhejiye, main yahin hoon.`
        : `I'm checking with ${contact.name} right now. Please don't send any money in the meantime. I'm right here with you.`;
      const structuredContent = { request_id: req.id, contact_name: contact.name, status: req.status, say };
      return { content: [{ type: "text", text: say }], structuredContent };
    },
  );
}
