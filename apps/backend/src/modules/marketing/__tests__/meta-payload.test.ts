import { describe, it, expect } from "vitest";
import { buildMetaServerEventPayload } from "../meta-payload.js";

describe("buildMetaServerEventPayload (V3)", () => {
    const baseInput = {
        eventName: "Purchase" as const,
        eventId: "evt_123",
        eventTime: new Date("2026-01-01T00:00:00Z"),
        user: { id: "user_1", email: "a@b.com" },
        landing: null,
    };

    it("hashes email and userId", () => {
        const p = buildMetaServerEventPayload(baseInput);
        expect(p.user_data.em?.[0]).toMatch(/^[a-f0-9]{64}$/);
        expect(p.user_data.external_id?.[0]).toMatch(/^[a-f0-9]{64}$/);
    });

    it("omits custom_data when not provided", () => {
        const p = buildMetaServerEventPayload(baseInput);
        expect(p.custom_data).toBeUndefined();
    });

    it("includes custom_data when value/currency supplied", () => {
        const p = buildMetaServerEventPayload({
            ...baseInput,
            customData: { value: 9.99, currency: "EUR" },
        });
        expect(p.custom_data).toEqual({ value: 9.99, currency: "EUR" });
    });

    it("omits custom_data when empty object", () => {
        const p = buildMetaServerEventPayload({ ...baseInput, customData: {} });
        expect(p.custom_data).toBeUndefined();
    });

    it("works without request data (V3 made request optional)", () => {
        const p = buildMetaServerEventPayload(baseInput);
        expect(p.user_data.client_ip_address).toBeUndefined();
        expect(p.user_data.client_user_agent).toBeUndefined();
    });

    it("populates client info when request supplied", () => {
        const p = buildMetaServerEventPayload({
            ...baseInput,
            request: { ip: "1.2.3.4", userAgent: "ua" },
        });
        expect(p.user_data.client_ip_address).toBe("1.2.3.4");
        expect(p.user_data.client_user_agent).toBe("ua");
    });
});
