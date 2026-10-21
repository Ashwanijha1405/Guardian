export type Locale = "hi-IN" | "en-IN" | "en-US";

export type FlagId =
  | "authority_impersonation"
  | "arrest_threat"
  | "secrecy_demand"
  | "isolation_or_continuous_call"
  | "money_demand"
  | "unusual_payment_rail"
  | "urgency"
  | "family_in_distress"
  | "parcel_or_courier_pretext"
  | "money_laundering_accusation"
  | "video_call_interrogation";

export type TypologyId =
  | "digital_arrest"
  | "fake_rbi_safe_account"
  | "courier_narcotics"
  | "grandparent_voice_clone"
  | "government_impersonation_us";

export type Band = "low" | "medium" | "high" | "critical";
export type RecommendedAction = "reassure" | "pause_and_verify" | "end_call_now";

export interface RiskInput {
  text: string;
  locale?: Locale;
}

export interface Flag {
  id: FlagId;
  label: string;
  weight: number;
  evidence: string;
}

export interface RiskAssessment {
  score: number;
  band: Band;
  typology: TypologyId | "none";
  typologyConfidence: number;
  flags: Flag[];
  recommendedAction: RecommendedAction;
  explanation: string;
}
