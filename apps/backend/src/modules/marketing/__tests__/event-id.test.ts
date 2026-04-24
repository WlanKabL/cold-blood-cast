import { describe, it, expect } from "vitest";
import { buildCanonicalEventId, MARKETING_EVENT_NAMESPACE } from "../event-id.js";

describe("buildCanonicalEventId", () => {
    it("is deterministic for the same input", () => {
        const a = buildCanonicalEventId({
            registrationTransactionId: "user_abc",
            userId: "user_abc",
            eventName: "CompleteRegistration",
        });
        const b = buildCanonicalEventId({
            registrationTransactionId: "user_abc",
            userId: "user_abc",
            eventName: "CompleteRegistration",
        });
        expect(a).toBe(b);
    });

    it("differs across users", () => {
        const a = buildCanonicalEventId({
            registrationTransactionId: "user_a",
            userId: "user_a",
            eventName: "CompleteRegistration",
        });
        const b = buildCanonicalEventId({
            registrationTransactionId: "user_b",
            userId: "user_b",
            eventName: "CompleteRegistration",
        });
        expect(a).not.toBe(b);
    });

    it("differs across event names", () => {
        const a = buildCanonicalEventId({
            registrationTransactionId: "user_a",
            userId: "user_a",
            eventName: "CompleteRegistration",
        });
        const b = buildCanonicalEventId({
            registrationTransactionId: "user_a",
            userId: "user_a",
            eventName: "PageView",
        });
        expect(a).not.toBe(b);
    });

    it("returns a v5 UUID", () => {
        const id = buildCanonicalEventId({
            registrationTransactionId: "user_xyz",
            userId: "user_xyz",
            eventName: "CompleteRegistration",
        });
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("uses the documented namespace", () => {
        expect(MARKETING_EVENT_NAMESPACE).toBe("6f2c2d0e-9b6f-5a1c-9b3e-7e3a8b2c1d4a");
    });
});
