import { EventEmitter } from "node:events";
import type { FamilyEvent } from "./events.js";
import type { VerificationRequest } from "./verifications.js";

export type BusMessage =
  | { type: "alert"; event: FamilyEvent }
  | { type: "verification"; verification: VerificationRequest };

// One in-process emitter: MCP tool calls publish, dashboard SSE connections subscribe.
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function publish(message: BusMessage): void {
  emitter.emit("message", message);
}

export function subscribe(listener: (message: BusMessage) => void): () => void {
  emitter.on("message", listener);
  return () => emitter.off("message", listener);
}
