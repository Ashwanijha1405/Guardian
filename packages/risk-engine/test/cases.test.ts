import { afterAll, describe, expect, it } from "vitest";
import { assessRisk, listFlags, listTypologies } from "../src/index.js";
import type { Band } from "../src/types.js";
import { type Case, extraCases } from "./extra-cases.js";

const BAND_ORDER: Band[] = ["low", "medium", "high", "critical"];
const rank = (b: Band) => BAND_ORDER.indexOf(b);

const coreCases: Case[] = [
  {
    name: "demo-A-digital-arrest-hinglish",
    text: "Alexa, ek CBI officer video call pe hai, bol raha hai main digital arrest mein hoon, kisi ko batana mat, aur paise RBI safe account mein bhejne ko bol raha hai",
    locale: "hi-IN",
    minBand: "critical",
    typology: "digital_arrest",
    scam: true,
  },
  {
    name: "demo-B-grandparent-gift-cards",
    text: "My grandson just called crying, he's in jail and needs three thousand dollars in gift cards, he said don't tell his mom",
    locale: "en-US",
    minBand: "high",
    typology: "grandparent_voice_clone",
    scam: true,
  },
  {
    name: "courier-mumbai-police",
    text: "FedEx se call aaya ki aapke naam pe parcel hai jismein drugs found, ab Mumbai police officer baat karenge",
    locale: "en-IN",
    minBand: "medium",
    typology: "courier_narcotics",
    scam: true,
  },
  {
    name: "fake-rbi-safe-account",
    text: "Someone from RBI says my account is hacked and I must transfer my savings to an RBI safe account immediately",
    locale: "en-IN",
    minBand: "high",
    typology: "fake_rbi_safe_account",
    scam: true,
  },
  {
    name: "us-irs-warrant",
    text: "The IRS called and said there is a warrant for my arrest unless I pay $2,500 in gift cards today",
    locale: "en-US",
    minBand: "high",
    typology: "government_impersonation_us",
    scam: true,
  },
  {
    name: "devanagari-digital-arrest",
    text: "सीबीआई अधिकारी वीडियो कॉल पर कह रहे हैं कि आप डिजिटल अरेस्ट में हैं, किसी को मत बताना और तुरंत पैसे भेजो",
    locale: "hi-IN",
    minBand: "critical",
    typology: "digital_arrest",
    scam: true,
  },
  {
    name: "mixed-script-digital-arrest",
    text: "Police officer bol raha hai ki मेरे Aadhaar used for money laundering, warrant hai, call mat kaatna",
    locale: "hi-IN",
    minBand: "high",
    typology: "digital_arrest",
    scam: true,
  },
  { name: "benign-rahul-diwali", text: "Rahul called, he's coming home for Diwali", scam: false, maxBand: "low" },
  { name: "benign-courier-medicines", text: "the courier delivered my medicines", scam: false, maxBand: "low" },
  { name: "benign-son-bills", text: "my son sent money for my bills", scam: false, maxBand: "low" },
  { name: "benign-police-uncle", text: "police uncle came for the society meeting", scam: false, maxBand: "low" },
  { name: "benign-cbi-movie", text: "I watched a CBI movie on TV", scam: false, maxBand: "low" },
  { name: "benign-video-call-grandson", text: "Mera pota video call pe Diwali ki photo dikha raha tha", scam: false, maxBand: "low" },
];

const allCases = [...coreCases, ...extraCases];
const tally = { caught: 0, missed: [] as string[], falsePositives: [] as string[], trueNegatives: 0 };

describe("risk engine cases", () => {
  it.each(allCases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const r = assessRisk({ text: c.text, locale: c.locale });
    const flagged = rank(r.band) >= rank("medium");
    if (c.scam) flagged ? tally.caught++ : tally.missed.push(c.name);
    else flagged ? tally.falsePositives.push(c.name) : tally.trueNegatives++;

    const detail = `${r.band} ${r.score} ${r.typology} [${r.flags.map((f) => `${f.id}:"${f.evidence}"`).join(", ")}]`;
    if (c.minBand) expect(rank(r.band), detail).toBeGreaterThanOrEqual(rank(c.minBand));
    if (c.maxBand) expect(rank(r.band), detail).toBeLessThanOrEqual(rank(c.maxBand));
    if (c.typology) expect(r.typology, detail).toBe(c.typology);
    for (const f of r.flags) expect(f.evidence.length).toBeGreaterThan(0);
  });

  afterAll(() => {
    const scams = allCases.filter((c) => c.scam).length;
    console.log(
      `\nRisk engine summary: caught ${tally.caught}/${scams} scams, ` +
        `missed ${tally.missed.length} ${JSON.stringify(tally.missed)}, ` +
        `false positives ${tally.falsePositives.length}/${allCases.length - scams} ${JSON.stringify(tally.falsePositives)}\n`,
    );
  });
});

describe("assessment shape", () => {
  it("maps bands to actions and explains with evidence", () => {
    const r = assessRisk({ text: coreCases[0]!.text });
    expect(r.recommendedAction).toBe("end_call_now");
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.explanation).toMatch(/threatening arrest/);
  });

  it("reassures on benign input", () => {
    const r = assessRisk({ text: "Rahul called, he's coming home for Diwali" });
    expect(r).toMatchObject({ band: "low", typology: "none", recommendedAction: "reassure", flags: [] });
  });

  it("lists flags and typologies", () => {
    expect(listFlags()).toHaveLength(11);
    expect(listTypologies().map((t) => t.id)).toContain("digital_arrest");
  });
});
