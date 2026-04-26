// ─── Meta Pixel / Conversions API payload builder ───────────
// Plan v1.7 §11.2 — only send fields the legal/consent model justifies.

import { createHash } from "node:crypto";
import type { MarketingEventName } from "@cold-blood-cast/shared";

export interface MetaUserData {
    em?: string[]; // hashed email
    fbc?: string;
    fbp?: string;
    external_id?: string[]; // hashed userId
    client_ip_address?: string;
    client_user_agent?: string;
}

export interface MetaServerEventPayload {
    event_name: MarketingEventName;
    event_time: number;
    event_id: string;
    action_source: "website";
    event_source_url?: string;
    user_data: MetaUserData;
    custom_data?: Record<string, unknown>;
}

export interface BuildMetaPayloadInput {
    eventName: MarketingEventName;
    eventId: string;
    eventTime: Date;
    user: { id: string; email: string };
    landing: {
        fbc?: string | null;
        fbp?: string | null;
        landingPath?: string | null;
    } | null;
    request?: { ip?: string | null; userAgent?: string | null };
    sourceUrl?: string;
    /** V3: monetary or other custom_data fields (e.g. value, currency). */
    customData?: Record<string, unknown>;
}

/** SHA-256 lowercase trim hash per Meta CAPI spec. */
function sha256Lower(value: string): string {
    return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function buildMetaServerEventPayload(input: BuildMetaPayloadInput): MetaServerEventPayload {
    const userData: MetaUserData = {
        em: [sha256Lower(input.user.email)],
        external_id: [sha256Lower(input.user.id)],
    };
    if (input.landing?.fbc) userData.fbc = input.landing.fbc;
    if (input.landing?.fbp) userData.fbp = input.landing.fbp;
    if (input.request?.ip) userData.client_ip_address = input.request.ip;
    if (input.request?.userAgent) userData.client_user_agent = input.request.userAgent;

    const payload: MetaServerEventPayload = {
        event_name: input.eventName,
        event_time: Math.floor(input.eventTime.getTime() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.sourceUrl,
        user_data: userData,
    };
    if (input.customData && Object.keys(input.customData).length > 0) {
        payload.custom_data = input.customData;
    }
    return payload;
}
