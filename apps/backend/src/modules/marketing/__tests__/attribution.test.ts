import { describe, it, expect } from "vitest";
import {
    TouchPriority,
    computeTouchPriority,
    isWeakerOrEqualThan,
    isStillValid,
    computeExpiresAt,
    normalizeLandingInput,
} from "../attribution.js";

describe("computeTouchPriority", () => {
    it("paid medium with utm → PAID_CAMPAIGN", () => {
        expect(
            computeTouchPriority({
                utmSource: "facebook",
                utmMedium: "cpc",
                utmCampaign: "fall_sale",
                fbclid: null,
                referrer: null,
            }),
        ).toBe(TouchPriority.PAID_CAMPAIGN);
    });

    it("fbclid alone → PAID_CAMPAIGN", () => {
        expect(
            computeTouchPriority({
                utmSource: null,
                utmMedium: null,
                utmCampaign: null,
                fbclid: "abc123",
                referrer: null,
            }),
        ).toBe(TouchPriority.PAID_CAMPAIGN);
    });

    it("organic utm tags → ORGANIC_CAMPAIGN", () => {
        expect(
            computeTouchPriority({
                utmSource: "newsletter",
                utmMedium: "email",
                utmCampaign: "weekly",
                fbclid: null,
                referrer: null,
            }),
        ).toBe(TouchPriority.ORGANIC_CAMPAIGN);
    });

    it("only referrer → REFERRER", () => {
        expect(
            computeTouchPriority({
                utmSource: null,
                utmMedium: null,
                utmCampaign: null,
                fbclid: null,
                referrer: "https://reddit.com/r/snakes",
            }),
        ).toBe(TouchPriority.REFERRER);
    });

    it("nothing → DIRECT", () => {
        expect(
            computeTouchPriority({
                utmSource: null,
                utmMedium: null,
                utmCampaign: null,
                fbclid: null,
                referrer: null,
            }),
        ).toBe(TouchPriority.DIRECT);
    });
});

describe("isWeakerOrEqualThan", () => {
    it("REFERRER does not overwrite ORGANIC_CAMPAIGN", () => {
        expect(isWeakerOrEqualThan(TouchPriority.REFERRER, TouchPriority.ORGANIC_CAMPAIGN)).toBe(
            true,
        );
    });
    it("PAID_CAMPAIGN overwrites ORGANIC_CAMPAIGN", () => {
        expect(isWeakerOrEqualThan(TouchPriority.PAID_CAMPAIGN, TouchPriority.ORGANIC_CAMPAIGN)).toBe(
            false,
        );
    });
    it("equal priority does not overwrite", () => {
        expect(isWeakerOrEqualThan(TouchPriority.PAID_CAMPAIGN, TouchPriority.PAID_CAMPAIGN)).toBe(
            true,
        );
    });
});

describe("computeExpiresAt + isStillValid", () => {
    it("ttl arithmetic is correct", () => {
        const now = new Date("2024-01-01T00:00:00.000Z");
        const expires = computeExpiresAt(now, 30);
        expect(expires.toISOString()).toBe("2024-01-31T00:00:00.000Z");
    });
    it("isStillValid before expiry", () => {
        const now = new Date("2024-01-15T00:00:00.000Z");
        const expires = new Date("2024-01-31T00:00:00.000Z");
        expect(isStillValid({ id: "x", expiresAt: expires } as never, now)).toBe(true);
    });
    it("isStillValid after expiry", () => {
        const now = new Date("2024-02-01T00:00:00.000Z");
        const expires = new Date("2024-01-31T00:00:00.000Z");
        expect(isStillValid({ id: "x", expiresAt: expires } as never, now)).toBe(false);
    });
});

describe("normalizeLandingInput", () => {
    it("trims and nulls empty strings", () => {
        const out = normalizeLandingInput({
            landingSessionId: "11111111-1111-1111-1111-111111111111",
            utmSource: "  facebook  ",
            utmMedium: "",
            utmCampaign: undefined,
            referrer: "   ",
        });
        expect(out.utmSource).toBe("facebook");
        expect(out.utmMedium).toBeNull();
        expect(out.utmCampaign).toBeNull();
        expect(out.referrer).toBeNull();
    });
});
