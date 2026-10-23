import { App } from "@modelcontextprotocol/ext-apps";
import { esc } from "./shared.js";

type Lang = "en" | "hi";

interface Verification {
  contact_name: string;
  status: "pending" | "confirmed_safe" | "needs_help" | "no_response";
  /** Resolved by the server from the original request, so it is right even when the tool call omits a locale. */
  locale?: string;
}

// One icon and one line per status, in the user's language: Dadi should get it at a glance.
const STATUS: Record<Verification["status"], { tone: string; icon: string } & Record<Lang, (name: string) => string>> = {
  pending: { tone: "slate", icon: "…", en: (n) => `Waiting for ${n}…`, hi: (n) => `${n} के जवाब का इंतज़ार…` },
  confirmed_safe: { tone: "low", icon: "✓", en: (n) => `${n} says: it's a scam`, hi: (n) => `${n} ने बताया: यह धोखा है` },
  needs_help: { tone: "medium", icon: "☎", en: (n) => `${n} will call you now`, hi: (n) => `${n} आपको अभी कॉल करेंगे` },
  no_response: { tone: "slate", icon: "!", en: () => "No answer yet. Hang up, don't pay.", hi: () => "जवाब नहीं आया। फ़ोन काटें, पैसे न दें।" },
};

const CSS_STYLE = `
.card { flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1.4rem; }
.icon { width: 9rem; height: 9rem; border-radius: 50%; display: grid; place-items: center; background: var(--tone); color: #fff; font-size: 5rem; font-weight: 800; line-height: 1; }
.icon.small-text { font-size: 2.6rem; }
.line { font-size: 2.2rem; font-weight: 800; line-height: 1.25; max-width: 18ch; text-wrap: balance; }
`;

function render(root: HTMLElement, v: Verification, lang: Lang): void {
  const s = STATUS[v.status];
  root.lang = lang;
  root.className = `card tone-${s.tone}`;
  root.innerHTML = `
    <div class="icon ${s.icon.length > 2 ? "small-text" : ""}" aria-hidden="true">${s.icon}</div>
    <h1 class="line">${s[lang](esc(v.contact_name))}</h1>`;
}

const style = document.createElement("style");
style.textContent = CSS_STYLE;
document.head.append(style);

const root = document.getElementById("root")!;
let lang: Lang = "hi";
const app = new App({ name: "Guardian verification card", version: "0.1.0" });
app.ontoolinput = ({ arguments: args }) => {
  lang = String(args?.locale ?? "hi-IN").startsWith("en") ? "en" : "hi";
};
app.ontoolresult = (result) => {
  const v = result.structuredContent as unknown as Verification | undefined;
  if (!v) return;
  if (v.locale) lang = v.locale.startsWith("en") ? "en" : "hi";
  render(root, v, lang);
};
void app.connect();
