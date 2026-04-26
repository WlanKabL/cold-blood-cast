// ─── Canonical event_id generation (UUIDv5) ─────────────────
// Plan v1.7 §4.4 — Single source of truth for event_id.
//
// Algorithm:
//   namespace = MARKETING_EVENT_NAMESPACE (fixed UUID, never changed)
//   input     = `${registrationTransactionId}:${userId}:${eventName}`
//   eventId   = uuidv5(input, namespace)
//
// `registrationTransactionId` is the user.id (cuid) generated inside the
// registration transaction. This is stable, deterministic per successful
// registration, and never collides with replays of the same logical signup.

import { createHash } from "node:crypto";
import type { MarketingEventName } from "@cold-blood-cast/shared";

/** Fixed namespace for v1 marketing events. Do not change without a plan revision. */
export const MARKETING_EVENT_NAMESPACE = "6f2c2d0e-9b6f-5a1c-9b3e-7e3a8b2c1d4a";

export interface CanonicalEventIdInput {
    registrationTransactionId: string;
    userId: string;
    eventName: MarketingEventName;
}

/** Build the canonical UUIDv5 event_id deterministically. */
export function buildCanonicalEventId(input: CanonicalEventIdInput): string {
    const concatenated = `${input.registrationTransactionId}:${input.userId}:${input.eventName}`;
    return uuidv5(concatenated, MARKETING_EVENT_NAMESPACE);
}

// ─── Minimal RFC 4122 §4.3 UUIDv5 implementation (SHA-1) ────
// Avoids adding a `uuid` dep just for this one use. Audit: only uses node:crypto.

function uuidv5(name: string, namespace: string): string {
    const namespaceBytes = parseUuid(namespace);
    const nameBytes = Buffer.from(name, "utf8");
    const hash = createHash("sha1").update(namespaceBytes).update(nameBytes).digest();

    const bytes = Buffer.from(hash.subarray(0, 16));
    bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

    return formatUuid(bytes);
}

function parseUuid(uuid: string): Buffer {
    const hex = uuid.replace(/-/g, "");
    if (hex.length !== 32) throw new Error(`Invalid UUID: ${uuid}`);
    return Buffer.from(hex, "hex");
}

function formatUuid(bytes: Buffer): string {
    const hex = bytes.toString("hex");
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
    ].join("-");
}
