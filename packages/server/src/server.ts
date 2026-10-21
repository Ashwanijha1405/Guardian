import { McpServer } from "@modelcontextprotocol/server";
import { registerAssessScamRisk } from "./tools/assessScamRisk.js";
import { registerCheckVerification } from "./tools/checkVerification.js";
import { registerGetHouseholdContext } from "./tools/getHouseholdContext.js";
import { registerGetSafetyGuidance } from "./tools/getSafetyGuidance.js";
import { registerNotifyFamily } from "./tools/notifyFamily.js";
import { registerVerifyWithFamily } from "./tools/verifyWithFamily.js";

const INSTRUCTIONS = `Guardian protects an elderly user from impersonation scams such as "digital arrest".
When the user describes a call, video call or message involving money, police/CBI/ED/RBI/IRS, arrest, secrecy, a parcel, or a relative in trouble:
1. Call assess_scam_risk first with the user's own words.
2. If band is high or critical: call get_safety_guidance with the returned typology, then notify_family with a one-line summary (never the transcript).
3. If the caller claims to be a relative in trouble, or the user is unsure, call verify_with_family, then poll check_verification every few seconds until the status is no longer pending.
4. Speak the guidance calmly: short, warm, firm. Never shame the user. Reply in the language they used.
If band is low, reassure the user briefly and continue normally.`;

export function createGuardianServer(): McpServer {
  const server = new McpServer({ name: "guardian", version: "0.1.0" }, { instructions: INSTRUCTIONS });
  registerAssessScamRisk(server);
  registerGetSafetyGuidance(server);
  registerNotifyFamily(server);
  registerGetHouseholdContext(server);
  registerVerifyWithFamily(server);
  registerCheckVerification(server);
  return server;
}
