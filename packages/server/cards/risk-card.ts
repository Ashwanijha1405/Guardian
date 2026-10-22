import { App } from "@modelcontextprotocol/ext-apps";
import { esc, TYPOLOGY } from "./shared.js";

interface Flag {
  id: string;
  label: string;
  weight: number;
  evidence: string;
}

interface RiskAssessment {
  score: number;
  band: "low" | "medium" | "high" | "critical";
  typology: string;
  flags: Flag[];
  recommendedAction: "reassure" | "pause_and_verify" | "end_call_now";
  explanation: string;
}

const BAND = {
  low: { en: "Low risk", hi: "कम खतरा" },
  medium: { en: "Be careful", hi: "सावधान रहें" },
  high: { en: "High risk", hi: "ज़्यादा खतरा" },
  critical: { en: "Scam alert", hi: "धोखे का खतरा" },
};

const ACTION = {
  reassure: { en: "Looks safe", hi: "सब ठीक लगता है" },
  pause_and_verify: { en: "Pause. Check with family first.", hi: "रुकिए, पहले परिवार से पूछिए" },
  end_call_now: { en: "End the call now. Don't pay.", hi: "अभी कॉल काटें, पैसे न भेजें" },
};

const CSS_STYLE = `
.dial { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; width: 15rem; }
.dial svg { width: 100%; height: auto; }
.dial .track { stroke: var(--line); }
.dial .value { stroke: var(--tone); transition: stroke-dashoffset .8s ease-out; }
.dial text { font-family: var(--font); fill: var(--ink); }
.band { font-size: 1.5rem; font-weight: 800; color: var(--tone); text-align: center; line-height: 1.2; }
.band .hi { display: block; font-size: 1.1rem; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1rem; }
.typology { font-size: 2rem; font-weight: 800; line-height: 1.15; }
.typology .hi { display: block; font-size: 1.35rem; color: var(--muted); }
.explanation { font-size: 1.1rem; }
.flags { background: var(--card); border: 1px solid var(--line); border-radius: .8rem; }
.flags li { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem .9rem; font-size: 1rem; }
.flags li + li { border-top: 1px solid var(--line); }
.flags q { font-weight: 700; quotes: "“" "”"; }
.flags .weight { color: var(--muted); white-space: nowrap; }
.action { margin-top: auto; border-radius: .8rem; padding: .9rem 1.2rem; background: var(--tone); color: #fff; font-size: 1.35rem; font-weight: 800; }
.action .hi { display: block; font-size: 1.1rem; }
/* Hosts often give the card a slot, not the whole screen: stack it and keep only the top three reasons. */
@media (max-width: 760px) {
  .card { flex-direction: column; gap: .8rem; padding: 1rem 1.1rem; }
  .dial { flex-direction: row; width: auto; gap: 1rem; justify-content: flex-start; }
  .dial svg { width: 6.5rem; }
  .band { text-align: left; }
  .typology { font-size: 1.6rem; }
  .explanation { display: none; }
  .typology .hi { margin-top: .2rem; }
}
@media (max-width: 760px) and (max-height: 440px) {
  .flags li:nth-child(n + 4) { display: none; }
  .action { font-size: 1.2rem; padding: .7rem 1rem; }
}
`;

function dial(score: number): string {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  return `<svg viewBox="0 0 120 120" role="img" aria-label="Risk score ${score} out of 100">
    <circle class="track" cx="60" cy="60" r="${r}" fill="none" stroke-width="12"/>
    <circle class="value" cx="60" cy="60" r="${r}" fill="none" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)"/>
    <text x="60" y="66" text-anchor="middle" font-size="30" font-weight="800">${score}</text>
    <text x="60" y="84" text-anchor="middle" font-size="10" fill="#6e665c">/ 100</text>
  </svg>`;
}

function render(root: HTMLElement, r: RiskAssessment): void {
  const typology = TYPOLOGY[r.typology] ?? TYPOLOGY.none!;
  // Show the strongest five; every flag carries the exact phrase that triggered it.
  const flags = r.flags.slice(0, 5).map((f) =>
    `<li><span>${esc(f.label)}: <q>${esc(f.evidence)}</q></span><span class="weight">+${f.weight}</span></li>`).join("");
  root.className = `card tone-${r.band}`;
  root.innerHTML = `
    <section class="dial">${dial(r.score)}
      <p class="band">${BAND[r.band].en}<span class="hi" lang="hi">${BAND[r.band].hi}</span></p>
    </section>
    <section class="body">
      <h1 class="typology">${esc(typology.en)}<span class="hi" lang="hi">${esc(typology.hi)}</span></h1>
      <p class="explanation">${esc(r.explanation)}</p>
      ${flags ? `<ul class="flags" aria-label="Why">${flags}</ul>` : ""}
      <p class="action">${ACTION[r.recommendedAction].en}<span class="hi" lang="hi">${ACTION[r.recommendedAction].hi}</span></p>
    </section>`;
}

const style = document.createElement("style");
style.textContent = CSS_STYLE;
document.head.append(style);

const root = document.getElementById("root")!;
const app = new App({ name: "Guardian risk card", version: "0.1.0" });
// Handlers go on before connect() so the first tool result is never missed.
app.ontoolresult = (result) => {
  if (result.structuredContent) render(root, result.structuredContent as unknown as RiskAssessment);
};
void app.connect();
