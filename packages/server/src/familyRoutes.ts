import { Router } from "express";
import { z } from "zod";
import { subscribe } from "./bus.js";
import { household } from "./data.js";
import { listEvents } from "./events.js";
import { listVerifications, respondToVerification } from "./verifications.js";

const respondBody = z.object({ status: z.enum(["confirmed_safe", "needs_help"]) });

function snapshot() {
  const contacts = household.trustedContacts.map(({ phone: _phone, ...c }) => c);
  return { alerts: listEvents(), verifications: listVerifications(), household: { persona: household.persona, contacts } };
}

/** HTTP API for the family dashboard (Rahul's phone). Summaries only; transcripts never reach this layer. */
export function familyRoutes(): Router {
  const router = Router();

  router.get("/events", (_req, res) => {
    res.json(snapshot());
  });

  // SSE: a snapshot first so a freshly opened dashboard is complete, then live bus messages.
  router.get("/events/stream", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    const send = (type: string, data: unknown) => res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);

    send("snapshot", snapshot());
    const unsubscribe = subscribe((msg) => send(msg.type, msg.type === "alert" ? msg.event : msg.verification));
    // Comment lines keep proxies (Render, Cloudflare) from closing an idle stream.
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  router.post("/verifications/:id/respond", (req, res) => {
    const parsed = respondBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "status must be confirmed_safe or needs_help" });
      return;
    }
    const updated = respondToVerification(req.params.id, parsed.data.status);
    if (!updated) {
      res.status(404).json({ error: "verification not found" });
      return;
    }
    res.json(updated);
  });

  return router;
}
