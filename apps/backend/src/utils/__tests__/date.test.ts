import { describe, it, expect } from "vitest";
import { todayAsFilename } from "../date.js";

describe("date utils", () => {
    describe("todayAsFilename", () => {
        it("returns a string in YYYY-MM-DD.json format", () => {
            const result = todayAsFilename();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}\.json$/);
        });

        it("matches today's date", () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const expected = `${year}-${month}-${day}.json`;
            expect(todayAsFilename()).toBe(expected);
        });
    });
});
