import { App } from "@modelcontextprotocol/ext-apps";
import { esc } from "./shared.js";

interface Verification {
  contact_name: string;
  status: "pending" | "confirmed_safe" | "needs_help" | "no_response";
  say: string;
}

const STATUS = {
  pending: { tone: "slate", icon: "…", en: (n: string) => `Waiting for ${n}…`, hi: (n: string) => `${n} के जवाब का इंतज़ार…` },
  confirmed_safe: { tone: "low", icon: "✓", en: (n: string) => `${n} confirmed: it's a scam`, hi: (n: string) => `${n} ने बताया: यह धोखा है` },
  needs_help: { tone: "medium", icon: "!", en: (n: string) => `${n} asked for help`, hi: (n: string) => `${n} ने मदद माँगी है` },
  no_response: { tone: "slate", icon: "☎", en: () => "No response — call 1930", hi: () => "जवाब नहीं आया — 1930 पर कॉल करें" },
};

const CSS_STYLE = `
.card { flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1.2rem; }
.icon { width: 9rem; height: 9rem; border-radius: 50%; display: grid; place-items: center; background: var(--tone); color: #fff; font-size: 5rem; font-weight: 800; line-height: 1; }
.line { font-size: 2.4rem; font-weight: 800; line-height: 1.15; max-width: 22ch; }
.line .hi { display: block; font-size: 1.6rem; margin-top: .3rem; }
.say { font-size: 1.15rem; color: var(--muted); max-width: 40ch; }
`;

function render(root: HTMLElement, v: Verification): void {
  const s = STATUS[v.status];
  const name = esc(v.contact_name);
  root.className = `card tone-${s.tone}`;
  root.innerHTML = `
    <div class="icon" aria-hidden="true">${s.icon}</div>
    <h1 class="line">${s.en(name)}<span class="hi" lang="hi">${s.hi(name)}</span></h1>
    <p class="say">${esc(v.say)}</p>`;
}

const style = document.createElement("style");
style.textContent = CSS_STYLE;
document.head.append(style);

const root = document.getElementById("root")!;
const app = new App({ name: "Guardian verification card", version: "0.1.0" });
app.ontoolresult = (result) => {
  if (result.structuredContent) render(root, result.structuredContent as unknown as Verification);
};
void app.connect();
