import { FLAGS, type FlagDefinition } from "./lexicons/flags.js";
import { TYPOLOGIES, type TypologyDefinition } from "./lexicons/typologies.js";
import type { Band, Flag, FlagId, RecommendedAction, RiskAssessment, RiskInput, TypologyId } from "./types.js";

/*
 * Scoring formula (also documented in README.md):
 *   base       = sum of weights of distinct flags that fired
 *   confidence = 0.6 + 0.4 * (supporting flags present / supporting flags defined)   for the best typology, else 0
 *   bonus      = round(TYPOLOGY_BONUS * confidence)
 *   score      = min(100, base + bonus)
 * One flag alone never crosses "medium": the max single weight is 20 < 25.
 */
const TYPOLOGY_BONUS = 25;

// JS `\w` is ASCII-only even with /u; widen it so Devanagari suffixes (matras) match too.
const WORD_CHAR = "[\\p{L}\\p{M}\\p{N}]";
const compiled = FLAGS.map((flag) => ({
  flag,
  regexes: flag.patterns.map(
    (p) => new RegExp(`(?<!${WORD_CHAR})(?:${p.replaceAll("\\w", WORD_CHAR)})(?!${WORD_CHAR})`, "u"),
  ),
}));

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Latin diacritics
    .replace(/़/g, "") // Devanagari nukta: फ़ → फ
    .normalize("NFC")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectFlags(text: string): Flag[] {
  const flags: Flag[] = [];
  for (const { flag, regexes } of compiled) {
    const match = regexes.map((r) => r.exec(text)).find((m) => m !== null);
    if (match) flags.push({ id: flag.id, label: flag.label, lesson: flag.lesson, weight: flag.weight, evidence: match[0] });
  }
  return flags;
}

interface TypologyMatch {
  def: TypologyDefinition;
  confidence: number;
  rank: number;
}

function matchTypology(present: Set<FlagId>, text: string): TypologyMatch | null {
  let best: TypologyMatch | null = null;
  for (const def of TYPOLOGIES) {
    const required = def.requiredAnyOf.find((group) => group.every((f) => present.has(f)));
    if (!required) continue;
    if (def.mustMention && !def.mustMention.test(text)) continue;
    const supporting = def.supporting.filter((f) => present.has(f)).length;
    const confidence = 0.6 + 0.4 * (supporting / def.supporting.length);
    // Rank by every flag this typology explains, so a second satisfied required-group still counts.
    const explained = new Set([...def.requiredAnyOf.flat(), ...def.supporting].filter((f) => present.has(f)));
    const rank = explained.size + def.specificity;
    if (!best || rank > best.rank || (rank === best.rank && confidence > best.confidence)) {
      best = { def, confidence, rank };
    }
  }
  return best;
}

function toBand(score: number): Band {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 25) return "medium";
  return "low";
}

const ACTIONS: Record<Band, RecommendedAction> = {
  low: "reassure",
  medium: "pause_and_verify",
  high: "pause_and_verify",
  critical: "end_call_now",
};

const CLAUSES: Record<FlagId, string> = {
  authority_impersonation: "",
  arrest_threat: "is threatening arrest",
  secrecy_demand: "is asking you to keep it secret",
  isolation_or_continuous_call: "wants you to stay on the call",
  money_demand: "is asking for money",
  unusual_payment_rail: "wants payment in an unusual way",
  urgency: "is rushing you",
  family_in_distress: "says a family member is in trouble",
  parcel_or_courier_pretext: "mentions a parcel or courier",
  money_laundering_accusation: "is accusing you of money laundering",
  video_call_interrogation: "is questioning you on a video call",
};

function explain(flags: Flag[]): string {
  if (flags.length === 0) return "Nothing here matches a known scam pattern.";
  const authority = flags.find((f) => f.id === "authority_impersonation");
  const subject = authority ? `Someone claiming to be "${authority.evidence}"` : "The caller";
  const clauses = [...flags]
    .filter((f) => f.id !== "authority_impersonation")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((f) => CLAUSES[f.id]);
  if (clauses.length === 0) return `${subject} is involved, but nothing else looks suspicious.`;
  const joined = clauses.length === 1 ? clauses[0] : `${clauses.slice(0, -1).join(", ")} and ${clauses.at(-1)}`;
  return `${subject} ${joined}.`;
}

export function assessRisk(input: RiskInput): RiskAssessment {
  const text = normalize(input.text);
  const flags = detectFlags(text);
  const typology = matchTypology(new Set(flags.map((f) => f.id)), text);
  const base = flags.reduce((sum, f) => sum + f.weight, 0);
  const bonus = typology ? Math.round(TYPOLOGY_BONUS * typology.confidence) : 0;
  const score = Math.min(100, base + bonus);
  const band = toBand(score);
  return {
    score,
    band,
    typology: typology?.def.id ?? "none",
    typologyConfidence: typology ? Math.round(typology.confidence * 100) / 100 : 0,
    flags: flags.sort((a, b) => b.weight - a.weight),
    recommendedAction: ACTIONS[band],
    explanation: explain(flags),
  };
}

export function listFlags(): Array<Pick<FlagDefinition, "id" | "label" | "weight">> {
  return FLAGS.map(({ id, label, weight }) => ({ id, label, weight }));
}

export function listTypologies(): Array<{ id: TypologyId; label: string; region: string }> {
  return TYPOLOGIES.map(({ id, label, region }) => ({ id, label, region }));
}
