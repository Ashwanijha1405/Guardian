import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { publish } from "./bus.js";
import { DATA_DIR } from "./data.js";

export type Severity = "info" | "warning" | "critical";

export interface FamilyEvent {
  id: string;
  createdAt: string;
  severity: Severity;
  summary: string;
  typology?: string;
  score?: number;
}

// Overridable so the test suite never writes into the demo's alert history.
const EVENTS_FILE = process.env.GUARDIAN_EVENTS_FILE ?? DATA_DIR + "events.json";

// Loaded once at startup so alerts survive a restart; the JSON file is a write-through copy, not a database.
const events: FamilyEvent[] = existsSync(EVENTS_FILE) ? JSON.parse(readFileSync(EVENTS_FILE, "utf8")) : [];

export function addEvent(input: Omit<FamilyEvent, "id" | "createdAt">): FamilyEvent {
  const event: FamilyEvent = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  events.push(event);
  writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
  publish({ type: "alert", event });
  return event;
}

export function listEvents(): readonly FamilyEvent[] {
  return events;
}
