import { describe, it, expect } from "vitest";
import {
    activationCutoff,
    isActivatedWithinWindow,
} from "../activation-window.js";

describe("activation-window", () => {
    const boundAt = new Date("2026-04-01T00:00:00.000Z");

    describe("activationCutoff", () => {
        it("adds windowDays to boundAt", () => {
            const cutoff = activationCutoff(boundAt, 7);
            expect(cutoff.toISOString()).toBe("2026-04-08T00:00:00.000Z");
        });

        it("supports configurable windows", () => {
            expect(activationCutoff(boundAt, 1).toISOString()).toBe(
                "2026-04-02T00:00:00.000Z",
            );
            expect(activationCutoff(boundAt, 30).toISOString()).toBe(
                "2026-05-01T00:00:00.000Z",
            );
        });
    });

    describe("isActivatedWithinWindow", () => {
        it("returns true when an activation falls inside the window", () => {
            const events = [{ occurredAt: new Date("2026-04-03T12:00:00.000Z") }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(true);
        });

        it("returns false when no activation events exist (regression: fresh cohort bug)", () => {
            // The previous bug computed cutoff as `now - 7d`, which made activation
            // for a user signed up today always-false. Empty list must still be false
            // here, but the math must NOT depend on `now`.
            expect(isActivatedWithinWindow(boundAt, [], 7)).toBe(false);
        });

        it("returns false when activation occurred before binding (impossible but defensive)", () => {
            const events = [{ occurredAt: new Date("2026-03-30T00:00:00.000Z") }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(false);
        });

        it("returns false when activation occurred after the window", () => {
            const events = [{ occurredAt: new Date("2026-04-10T00:00:00.000Z") }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(false);
        });

        it("respects a configurable larger window", () => {
            const events = [{ occurredAt: new Date("2026-04-20T00:00:00.000Z") }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(false);
            expect(isActivatedWithinWindow(boundAt, events, 30)).toBe(true);
        });

        it("treats boundAt itself as inside the window (inclusive lower bound)", () => {
            const events = [{ occurredAt: boundAt }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(true);
        });

        it("treats the exact cutoff as inside the window (inclusive upper bound)", () => {
            const events = [{ occurredAt: activationCutoff(boundAt, 7) }];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(true);
        });

        it("any qualifying event in the list activates", () => {
            const events = [
                { occurredAt: new Date("2026-03-30T00:00:00.000Z") },
                { occurredAt: new Date("2026-04-05T00:00:00.000Z") },
                { occurredAt: new Date("2026-05-01T00:00:00.000Z") },
            ];
            expect(isActivatedWithinWindow(boundAt, events, 7)).toBe(true);
        });
    });
});
