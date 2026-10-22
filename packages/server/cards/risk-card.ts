import { App } from "@modelcontextprotocol/ext-apps";
import { esc, TYPOLOGY } from "./shared.js";

type Lang = "en" | "hi";

interface Flag {
  id: string;
  label: string;
  lesson: Record<Lang, string>;
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
  /** Earlier alerts of the same scam type in the last 7 days. */
  recentSimilar?: number;
}

const T = {
  en: {
    band: { low: "Low risk", medium: "Be careful", high: "High risk", critical: "Scam alert" },
    action: {
      reassure: "Looks safe",
      pause_and_verify: "Pause. Check with family first.",
      end_call_now: "End the call now. Don't pay.",
    },
    why: "Why this is a scam",
    heard: "You heard",
    safe: "Nothing here matches a known scam.",
    repeat: (n: number) => `${ordinalEn(n)} call like this this week`,
  },
  hi: {
    band: { low: "कम खतरा", medium: "सावधान रहें", high: "ज़्यादा खतरा", critical: "धोखे का खतरा" },
    action: {
      reassure: "सब ठीक लगता है",
      pause_and_verify: "रुकिए, पहले परिवार से पूछिए",
      end_call_now: "अभी कॉल काटें, पैसे न भेजें",
    },
    why: "यह धोखा क्यों है",
    heard: "आपने सुना",
    safe: "इसमें धोखे का कोई जाना-पहचाना संकेत नहीं है।",
    repeat: (n: number) => `इस हफ़्ते ऐसी ${ordinalHi(n)} कॉल`,
  },
};

function ordinalEn(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function ordinalHi(n: number): string {
  return ({ 2: "दूसरी", 3: "तीसरी", 4: "चौथी" } as Record<number, string>)[n] ?? `${n}वीं`;
}

const CSS_STYLE = `
.dial { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; width: 15rem; }
.dial svg { width: 100%; height: auto; }
.dial .track { stroke: var(--line); }
.dial .value { stroke: var(--tone); transition: stroke-dashoffset .8s ease-out; }
.dial text { font-family: var(--font); fill: var(--ink); }
.band { font-size: 1.5rem; font-weight: 800; color: var(--tone); text-align: center; line-height: 1.2; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .9rem; }
.typology { font-size: 2rem; font-weight: 800; line-height: 1.15; }
.repeat { align-self: flex-start; background: var(--tone); color: #fff; font-weight: 700; font-size: 1rem; border-radius: 999px; padding: .25rem .8rem; }
.why { font-size: 1.05rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.lessons { display: flex; flex-direction: column; gap: .7rem; }
.lessons li { border-left: .3rem solid var(--tone); padding-left: .8rem; }
.lessons p { font-size: 1.15rem; line-height: 1.35; }
.lessons .heard { display: block; margin-top: .15rem; font-size: .9rem; color: var(--muted); }
.safe { font-size: 1.2rem; }
.action { margin-top: auto; border-radius: .8rem; padding: .9rem 1.2rem; background: var(--tone); color: #fff; font-size: 1.35rem; font-weight: 800; }
/* Hosts often give the card a slot, not the whole screen: stack it and keep the top reasons. */
@media (max-width: 760px) {
  .card { flex-direction: column; gap: .7rem; padding: 1rem 1.1rem; }
  .dial { flex-direction: row; width: auto; gap: 1rem; justify-content: flex-start; }
  .dial svg { width: 5.5rem; }
  .band { text-align: left; }
  .typology { font-size: 1.5rem; }
  .lessons p { font-size: 1.05rem; }
  .lessons li:nth-child(n + 3) { display: none; }
  .action { font-size: 1.15rem; padding: .7rem 1rem; }
}
@media (max-width: 760px) and (max-height: 440px) {
  .lessons li:nth-child(n + 2) { display: none; }
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

function render(root: HTMLElement, r: RiskAssessment, lang: Lang): void {
  const t = T[lang];
  const typology = (TYPOLOGY[r.typology] ?? TYPOLOGY.none!)[lang];
  // Strongest reasons first; each lesson is paired with the exact phrase that triggered it.
  const lessons = r.flags.slice(0, 3).map((f) =>
    `<li><p>${esc(f.lesson[lang])}</p><span class="heard">${t.heard}: “${esc(f.evidence)}”</span></li>`).join("");
  const repeat = r.recentSimilar ? `<p class="repeat">${t.repeat(r.recentSimilar + 1)}</p>` : "";
  root.lang = lang;
  root.className = `card tone-${r.band}`;
  root.innerHTML = `
    <section class="dial">${dial(r.score)}<p class="band">${t.band[r.band]}</p></section>
    <section class="body">
      <h1 class="typology">${esc(typology)}</h1>
      ${repeat}
      ${r.band === "low" || !lessons
        ? `<p class="safe">${t.safe}</p>`
        : `<h2 class="why">${t.why}</h2><ul class="lessons">${lessons}</ul>`}
      <p class="action">${t.action[r.recommendedAction]}</p>
    </section>`;
}

const style = document.createElement("style");
style.textContent = CSS_STYLE;
document.head.append(style);

const root = document.getElementById("root")!;
// The card speaks the user's language: Hindi unless the assistant passed an English locale.
let lang: Lang = "hi";
const app = new App({ name: "Guardian risk card", version: "0.1.0" });
// Handlers go on before connect() so the first tool input/result is never missed.
app.ontoolinput = ({ arguments: args }) => {
  lang = String(args?.locale ?? "hi-IN").startsWith("en") ? "en" : "hi";
};
app.ontoolresult = (result) => {
  if (result.structuredContent) render(root, result.structuredContent as unknown as RiskAssessment, lang);
};
void app.connect();
