import { McpServer } from "@modelcontextprotocol/server";
import { registerAssessScamRisk } from "./tools/assessScamRisk.js";
import { registerGetHouseholdContext } from "./tools/getHouseholdContext.js";
import { registerGetSafetyGuidance } from "./tools/getSafetyGuidance.js";
import { registerNotifyFamily } from "./tools/notifyFamily.js";

const INSTRUCTIONS = `Guardian protects an elderly user from impersonation scams such as "digital arrest".
When the user describes a call, video call or message involving money, police/CBI/ED/RBI/IRS, arrest, secrecy, a parcel, or a relative in trouble:
1. Call assess_scam_risk first with the user's own words.
2. If band is high or critical: call get_safety_guidance with the returned typology, then notify_family with a one-line summary (never the transcript).
3. Speak the guidance calmly: short, warm, firm. Never shame the user. Reply in the language they used.
If band is low, reassure the user briefly and continue normally.`;

export function createGuardianServer(): McpServer {
  const server = new McpServer({ name: "guardian", version: "0.1.0" }, { instructions: INSTRUCTIONS });
  registerAssessScamRisk(server);
  registerGetSafetyGuidance(server);
  registerNotifyFamily(server);
  registerGetHouseholdContext(server);
  return server;
}
