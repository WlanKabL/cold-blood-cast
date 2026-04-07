import { describe, it, expect, vi } from "vitest";
import { format } from "../date";

describe("date utils", () => {
    describe("format", () => {
        it("returns a relative time string", () => {
            const now = Date.now();
            const result = format(now);
            expect(result).toContain("ago");
        });

        it("returns 'about X hours ago' for 2 hours back", () => {
            const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
            const result = format(twoHoursAgo);
            expect(result).toContain("hours ago");
        });

        it("handles past timestamps", () => {
            const yesterday = Date.now() - 24 * 60 * 60 * 1000;
            const result = format(yesterday);
            expect(result).toContain("ago");
        });
    });
});
