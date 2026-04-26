import { describe, it, expect } from "vitest";
import {
    audienceExportFilterSchema,
    createAudienceExportSchema,
    recordHighValueEventSchema,
    AUDIENCE_EXPORT_FORMATS,
    HIGH_VALUE_EVENT_NAMES,
} from "@cold-blood-cast/shared";

describe("recordHighValueEventSchema", () => {
    it("accepts a valid Purchase event", () => {
        const ok = recordHighValueEventSchema.safeParse({
            userId: "user_1",
            eventName: "Purchase",
            value: 9.99,
            currency: "eur",
        });
        expect(ok.success).toBe(true);
        if (ok.success) expect(ok.data.currency).toBe("EUR");
    });

    it("rejects negative value", () => {
        const r = recordHighValueEventSchema.safeParse({
            userId: "u",
            eventName: "Subscribe",
            value: -1,
            currency: "EUR",
        });
        expect(r.success).toBe(false);
    });

    it("rejects unsupported event name", () => {
        const r = recordHighValueEventSchema.safeParse({
            userId: "u",
            eventName: "PageView",
            value: 1,
            currency: "EUR",
        });
        expect(r.success).toBe(false);
    });

    it("rejects bad currency length", () => {
        const r = recordHighValueEventSchema.safeParse({
            userId: "u",
            eventName: "Purchase",
            value: 1,
            currency: "EU",
        });
        expect(r.success).toBe(false);
    });

    it("HIGH_VALUE_EVENT_NAMES contains expected entries", () => {
        expect(HIGH_VALUE_EVENT_NAMES).toEqual(["Subscribe", "Purchase"]);
    });
});

describe("audience export schemas", () => {
    it("supports all declared formats", () => {
        for (const fmt of AUDIENCE_EXPORT_FORMATS) {
            const r = createAudienceExportSchema.safeParse({
                name: "Test",
                format: fmt,
                filter: {},
            });
            expect(r.success).toBe(true);
        }
    });

    it("defaults format to csv when omitted", () => {
        const r = createAudienceExportSchema.safeParse({ name: "T", filter: {} });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.format).toBe("csv");
    });

    it("rejects empty name", () => {
        const r = createAudienceExportSchema.safeParse({ name: "", filter: {} });
        expect(r.success).toBe(false);
    });

    it("filter accepts utm filters and date strings", () => {
        const r = audienceExportFilterSchema.safeParse({
            utmSource: "fb",
            signedUpFrom: "2026-01-01T00:00:00Z",
            activatedOnly: true,
        });
        expect(r.success).toBe(true);
    });

    it("filter rejects invalid datetime", () => {
        const r = audienceExportFilterSchema.safeParse({ signedUpFrom: "not-a-date" });
        expect(r.success).toBe(false);
    });
});
