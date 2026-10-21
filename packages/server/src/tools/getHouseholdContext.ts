import type { McpServer } from "@modelcontextprotocol/server";
import { household } from "../data.js";

export function registerGetHouseholdContext(server: McpServer): void {
  server.registerTool(
    "get_household_context",
    {
      title: "Get household context",
      description:
        "Who the user is (name, preferred language, city) and their trusted family contacts. Use to address the user " +
        "correctly and to name the right family member when suggesting they call someone.",
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const { persona, trustedContacts } = household;
      // Phone numbers stay server-side; the assistant only needs names and relationships.
      const contacts = trustedContacts.map(({ phone: _phone, ...c }) => c);
      const text =
        `${persona.displayName}, prefers ${persona.preferredLanguage}. ` +
        `Contacts: ${contacts.map((c) => `${c.name} (${c.relationship})`).join(", ")}.`;
      return { content: [{ type: "text", text }], structuredContent: { persona, trustedContacts: contacts } };
    },
  );
}
