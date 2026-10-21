import type { FlagId, TypologyId } from "../types.js";

/**
 * A typology matches when ALL `required` flags fire, or any group in `requiredAnyOf` is fully present.
 * Supporting flags raise confidence but are never needed on their own.
 */
export interface TypologyDefinition {
  id: TypologyId;
  label: string;
  region: "IN" | "US" | "global";
  requiredAnyOf: FlagId[][];
  supporting: FlagId[];
  /** Phrase that must appear in the text, for typologies a flag alone can't pin down. */
  mustMention?: RegExp;
  /** Tie-breaker: a typology tied to a specific pretext (parcel, safe account, IRS) beats a generic one. */
  specificity: number;
}

export const TYPOLOGIES: TypologyDefinition[] = [
  {
    id: "digital_arrest",
    specificity: 0,
    label: "Digital arrest scam",
    region: "IN",
    requiredAnyOf: [["authority_impersonation", "arrest_threat"]],
    supporting: [
      "secrecy_demand", "isolation_or_continuous_call", "video_call_interrogation",
      "money_laundering_accusation", "money_demand",
    ],
  },
  {
    id: "fake_rbi_safe_account",
    specificity: 0.5,
    label: "Fake RBI 'safe account' scam",
    region: "IN",
    requiredAnyOf: [["authority_impersonation", "unusual_payment_rail"]],
    supporting: ["money_demand", "urgency", "secrecy_demand"],
    mustMention: /safe account|verification account|secure account|suraksha khata|सेफ अकाउंट|सुरक्षित (?:सत्यापन )?खात|सत्यापन खात/u,
  },
  {
    id: "courier_narcotics",
    specificity: 0.5,
    label: "Courier / narcotics parcel scam",
    region: "IN",
    requiredAnyOf: [
      ["parcel_or_courier_pretext", "authority_impersonation"],
      ["parcel_or_courier_pretext", "arrest_threat"],
    ],
    supporting: ["money_demand", "money_laundering_accusation", "video_call_interrogation", "secrecy_demand"],
  },
  {
    id: "grandparent_voice_clone",
    specificity: 0,
    label: "Grandparent / family emergency scam",
    region: "global",
    requiredAnyOf: [["family_in_distress", "money_demand"]],
    supporting: ["secrecy_demand", "urgency", "unusual_payment_rail"],
  },
  {
    id: "government_impersonation_us",
    specificity: 0.5,
    label: "US government impersonation (IRS/FBI/SSA)",
    region: "US",
    requiredAnyOf: [
      ["authority_impersonation", "arrest_threat"],
      ["authority_impersonation", "money_demand"],
    ],
    supporting: ["urgency", "unusual_payment_rail", "secrecy_demand"],
    mustMention: /\b(?:irs|fbi|ssa|social security|internal revenue|federal)\b/u,
  },
];
