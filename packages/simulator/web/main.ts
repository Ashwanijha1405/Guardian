import { clearCard, showCard } from "./card-host.js";
import { canListen, listen, speak, stopSpeaking } from "./speech.js";

const PRESETS: Record<string, string> = {
  digital_arrest:
    "Alexa, ek CBI officer video call pe hai, bol raha hai main digital arrest mein hoon, kisi ko batana mat, aur paise RBI safe account mein bhejne ko bol raha hai",
  grandson: "My grandson just called crying, he's in jail and needs three thousand dollars in gift cards, he said don't tell his mom",
  benign: "Rahul called, he's coming home for Diwali",
};

type Mode = "idle" | "listening" | "thinking" | "speaking" | "showing";
interface TurnEvent {
  type: string;
  [key: string]: unknown;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const screen = $("screen");
const heard = $("heard");
const reply = $("reply");
const waiting = $("waiting");
const cardSlot = $("card-slot");
const devLog = $("dev-log");
const mic = $<HTMLButtonElement>("mic");

const history: Array<{ role: "user" | "assistant"; text: string }> = [];
let busy = false;
let speechQueue = Promise.resolve();

const setMode = (mode: Mode) => (screen.dataset.mode = mode);

function tickClock(): void {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  $("date").textContent = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

function log(kind: string, text: string): void {
  const li = document.createElement("li");
  li.className = kind;
  li.textContent = text;
  devLog.append(li);
  li.scrollIntoView({ block: "nearest" });
}

/** Replies are queued so two sentences in one turn are spoken in order, never over each other. */
function say(text: string): void {
  reply.textContent = text;
  speechQueue = speechQueue.then(async () => {
    setMode("speaking");
    await speak(text);
    setMode(busy ? "thinking" : "showing");
  });
}

function handle(e: TurnEvent): void {
  switch (e.type) {
    case "tool_call":
      log("call", `→ ${e.name}(${JSON.stringify(e.args)})`);
      break;
    case "tool_result":
      log(e.isError ? "err" : "result", `← ${e.name}: ${e.summary}`);
      break;
    case "ui_resource":
      log("ui", `▣ render ${e.uri}`);
      void showCard(cardSlot, e.html as string, e.toolInput as Record<string, unknown>, e.toolResult);
      break;
    case "waiting":
      waiting.hidden = false;
      waiting.textContent = `Waiting for ${e.contact}… ${e.seconds}s`;
      break;
    case "assistant_text":
      waiting.hidden = true;
      history.push({ role: "assistant", text: e.text as string });
      say(e.text as string);
      break;
    case "error":
      log("err", `✕ ${e.message}`);
      say("Sorry, I couldn't reach Guardian just now. Please try again.");
      break;
  }
}

async function runTurn(text: string): Promise<void> {
  if (busy || !text.trim()) return;
  busy = true;
  stopSpeaking();
  speechQueue = Promise.resolve();
  document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) => (b.disabled = true));
  await clearCard(cardSlot);
  heard.textContent = text;
  reply.textContent = "";
  waiting.hidden = true;
  setMode("thinking");
  log("", `🗣 ${text}`);

  try {
    const res = await fetch("/api/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, history: history.slice(-8) }),
    });
    history.push({ role: "user", text });
    await readEvents(res, handle);
  } catch (err) {
    handle({ type: "error", message: (err as Error).message });
  } finally {
    busy = false;
    document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) => (b.disabled = false));
    await speechQueue;
    setMode("showing");
  }
}

/** Parses an SSE response from a POST (EventSource only supports GET). */
async function readEvents(res: Response, onEvent: (e: TurnEvent) => void): Promise<void> {
  if (!res.ok || !res.body) throw new Error(`Simulator backend returned ${res.status}`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const data = buffer.slice(0, end).split("\n").find((l) => l.startsWith("data: "));
      buffer = buffer.slice(end + 2);
      if (data) onEvent(JSON.parse(data.slice(6)) as TurnEvent);
    }
  }
}

let stopListening: (() => void) | null = null;

async function onMic(): Promise<void> {
  if (stopListening) return stopListening();
  if (!canListen) {
    alert("Speech recognition needs Chrome or Edge. Use the presets or 'Type instead'.");
    return;
  }
  stopSpeaking();
  setMode("listening");
  mic.setAttribute("aria-pressed", "true");
  heard.textContent = "";
  reply.textContent = "";
  const session = listen($<HTMLSelectElement>("mic-lang").value, (t) => (heard.textContent = t));
  stopListening = session.stop;
  try {
    const text = await session.done;
    if (text) await runTurn(text);
    else setMode("idle");
  } catch (err) {
    log("err", `✕ microphone: ${(err as Error).message}`);
    setMode("idle");
  } finally {
    stopListening = null;
    mic.setAttribute("aria-pressed", "false");
  }
}

async function showHealth(): Promise<void> {
  const res = await fetch("/api/health").catch(() => null);
  const body = (await res?.json().catch(() => null)) as { ok: boolean; error?: string; provider?: string; protocolVersion?: string; tools?: string[] } | null;
  $("dev-meta").textContent = body?.ok
    ? `Guardian MCP connected · protocol ${body.protocolVersion} · LLM ${body.provider} · ${body.tools?.length} tools: ${body.tools?.join(", ")}`
    : `Guardian not reachable: ${body?.error ?? "simulator backend down"}`;
}

mic.addEventListener("click", () => void onMic());
document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => void runTurn(PRESETS[b.dataset.preset!]!)),
);
$("type-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>("type-input");
  void runTurn(input.value);
  input.value = "";
});

tickClock();
setInterval(tickClock, 10_000);
void showHealth();
// Chrome loads voices asynchronously; touching the list early makes the first reply pick the right one.
if ("speechSynthesis" in window) speechSynthesis.getVoices();
