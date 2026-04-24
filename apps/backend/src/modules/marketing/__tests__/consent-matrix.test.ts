import { describe, it, expect } from "vitest";
import { decideMarketingDispatch } from "../consent-matrix.js";

describe("decideMarketingDispatch", () => {
    it("granted → full dispatch", () => {
        const r = decideMarketingDispatch("granted", "CompleteRegistration");
        expect(r).toEqual({
            persistEvent: true,
            storeFullPayload: true,
            browserDispatchAllowed: true,
            serverDispatchAllowed: true,
            initialStatus: "pending",
        });
    });

    for (const consent of ["denied", "unknown", "revoked"] as const) {
        it(`${consent} → audit-only skip`, () => {
            const r = decideMarketingDispatch(consent, "CompleteRegistration");
            expect(r.persistEvent).toBe(true);
            expect(r.storeFullPayload).toBe(false);
            expect(r.browserDispatchAllowed).toBe(false);
            expect(r.serverDispatchAllowed).toBe(false);
            expect(r.initialStatus).toBe("skipped");
        });
    }
});
