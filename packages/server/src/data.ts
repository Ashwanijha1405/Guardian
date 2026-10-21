import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Resolves to <repo>/data from both src/ (tsx) and dist/ (built), which sit at the same depth.
export const DATA_DIR = fileURLToPath(new URL("../../../data/", import.meta.url));

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  relationshipHi?: string;
  city?: string;
  phone?: string;
  primary: boolean;
}

export interface Household {
  persona: { id: string; displayName: string; preferredLanguage: string; languages: string[]; city: string; livesAlone: boolean };
  trustedContacts: Contact[];
  locale: string;
}

export interface Bilingual {
  en: string;
  hi: string;
}

export interface SafetyFact extends Bilingual {
  id: string;
  source: string;
  verified: boolean;
}

export interface TypologyGuidance {
  facts: SafetyFact[];
  nextSteps: Bilingual[];
}

export interface SafetyFacts {
  typologies: Record<string, TypologyGuidance>;
  general: TypologyGuidance;
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(DATA_DIR + name, "utf8")) as T;
}

export const household = readJson<Household>("household.json");
export const safetyFacts = readJson<SafetyFacts>("safety-facts.json");
