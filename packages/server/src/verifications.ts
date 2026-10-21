import { randomUUID } from "node:crypto";
import { publish } from "./bus.js";
import type { Contact } from "./data.js";

export type VerificationStatus = "pending" | "confirmed_safe" | "needs_help" | "no_response";
export type FamilyResponse = Extract<VerificationStatus, "confirmed_safe" | "needs_help">;

export interface VerificationRequest {
  id: string;
  contactId: string;
  contactName: string;
  /** Summary shown to the family member; never the raw conversation. */
  reason: string;
  claimedPerson?: string;
  typology?: string;
  status: VerificationStatus;
  createdAt: string;
  respondedAt?: string;
}

// Read per call so tests (and demos) can shorten the wait without restarting the process.
const timeoutMs = () => Number(process.env.VERIFICATION_TIMEOUT_MS ?? 90_000);

const requests = new Map<string, VerificationRequest>();

/** Pending requests past the timeout become no_response; the family can still answer later. */
function withTimeout(req: VerificationRequest): VerificationRequest {
  const expired = req.status === "pending" && Date.now() - Date.parse(req.createdAt) > timeoutMs();
  return expired ? { ...req, status: "no_response" } : req;
}

export function createVerification(
  contact: Contact,
  input: { reason: string; claimedPerson?: string; typology?: string },
): VerificationRequest {
  const req: VerificationRequest = {
    id: randomUUID(),
    contactId: contact.id,
    contactName: contact.name,
    status: "pending",
    createdAt: new Date().toISOString(),
    ...input,
  };
  requests.set(req.id, req);
  publish({ type: "verification", verification: req });
  return req;
}

export function getVerification(id: string): VerificationRequest | undefined {
  const req = requests.get(id);
  return req && withTimeout(req);
}

export function respondToVerification(id: string, status: FamilyResponse): VerificationRequest | undefined {
  const req = requests.get(id);
  if (!req) return undefined;
  const updated: VerificationRequest = { ...req, status, respondedAt: new Date().toISOString() };
  requests.set(id, updated);
  publish({ type: "verification", verification: updated });
  return updated;
}

export function listVerifications(): VerificationRequest[] {
  return [...requests.values()].map(withTimeout);
}
