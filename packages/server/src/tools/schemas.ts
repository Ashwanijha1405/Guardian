import { z } from "zod";

export const localeSchema = z
  .enum(["hi-IN", "en-IN", "en-US"])
  .optional()
  .describe("Language the user is speaking. Defaults to the household's preferred language.");

export const typologySchema = z.enum([
  "digital_arrest",
  "fake_rbi_safe_account",
  "courier_narcotics",
  "grandparent_voice_clone",
  "government_impersonation_us",
  "none",
]);

export const riskAssessmentSchema = z.object({
  score: z.number(),
  band: z.enum(["low", "medium", "high", "critical"]),
  typology: typologySchema,
  typologyConfidence: z.number(),
  flags: z.array(z.object({ id: z.string(), label: z.string(), weight: z.number(), evidence: z.string() })),
  recommendedAction: z.enum(["reassure", "pause_and_verify", "end_call_now"]),
  explanation: z.string(),
});
