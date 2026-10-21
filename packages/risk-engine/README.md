# @guardian/risk-engine

Deterministic, explainable scam typology scoring for impersonation scams ("digital arrest", fake RBI safe
account, courier/narcotics parcel, grandparent voice-clone, US IRS/FBI/SSA). Pure TypeScript, no I/O,
no dependencies, no LLM. The same input always gives the same score, and every flag carries the phrase that
triggered it.

```ts
import { assessRisk } from "@guardian/risk-engine";

assessRisk({ text: "CBI officer video call pe hai, digital arrest bol raha hai, kisi ko batana mat" });
// { score: 84, band: "critical", typology: "digital_arrest", recommendedAction: "end_call_now",
//   flags: [{ id: "arrest_threat", evidence: "digital arrest", weight: 20, ... }, ...],
//   explanation: 'Someone claiming to be "cbi" is threatening arrest, is asking you to keep it secret
//                 and is questioning you on a video call.' }
```

## How it works

1. **Normalize**: lowercase, strip Latin diacritics and the Devanagari nukta (फ़ → फ), straighten quotes.
2. **Flags**: 11 red-flag signals, each a list of regex phrases in English, romanized Hinglish and
   Devanagari (`src/lexicons/flags.ts`). A flag fires once, on its first matching phrase, which becomes its `evidence`.
3. **Typology**: 5 scam patterns (`src/lexicons/typologies.ts`). A typology matches when one of its
   required flag groups is fully present. If several match, the one that explains the most flags wins, with
   pretext-specific typologies (parcel, safe account, IRS) winning ties.
4. **Score**:

   ```
   base       = sum of weights of flags that fired
   confidence = 0.6 + 0.4 × (supporting flags present / supporting flags defined)   (0 if no typology)
   score      = min(100, base + round(25 × confidence))
   ```

   No single flag can push the score past "low" (the highest weight is 20, below the 25 cutoff), so one scary
   word such as "police" or "CBI" is never enough on its own.

| Band | Score | Action |
|---|---|---|
| low | < 25 | reassure |
| medium | 25–54 | pause_and_verify |
| high | 55–79 | pause_and_verify |
| critical | ≥ 80 | end_call_now |

## Flags and weights

| Flag | Weight |
|---|---|
| authority_impersonation | 20 |
| arrest_threat | 20 |
| unusual_payment_rail | 18 |
| family_in_distress | 18 |
| secrecy_demand | 15 |
| money_demand | 15 |
| money_laundering_accusation | 15 |
| isolation_or_continuous_call | 12 |
| parcel_or_courier_pretext | 10 |
| video_call_interrogation | 10 |
| urgency | 8 |

## Tests

`npm test` from the repo root. `test/cases.test.ts` runs 37 labelled cases (23 scams, 14 benign look-alikes
such as "I watched a CBI movie on TV") and prints a summary: caught / missed / false positives.
Current result: **23/23 scams caught, 0/14 false positives.**

## Limitations

Phrase rules, not ML: a paraphrase with no lexicon words will be missed, and the lexicons are the place to
extend coverage. Negation isn't modeled ("he did *not* ask for money" still flags money).
