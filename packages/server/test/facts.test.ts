import { describe, expect, it } from "vitest";
import { safetyFacts } from "../src/data.js";

// Alexa speaks these aloud, so an unchecked fact must never ship.
const all = [...Object.values(safetyFacts.typologies), safetyFacts.general].flatMap((g) => g.facts);

describe("safety facts", () => {
  it("are all verified against an https source", () => {
    for (const f of all) {
      expect(f.verified, f.id).toBe(true);
      expect(f.source, f.id).toMatch(/^https:\/\//);
    }
  });

  it("give every scam typology at least one fact to speak", () => {
    for (const [typology, g] of Object.entries(safetyFacts.typologies)) expect(g.facts.length, typology).toBeGreaterThan(0);
  });
});
