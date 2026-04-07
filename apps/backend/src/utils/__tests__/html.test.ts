import { describe, it, expect } from "vitest";
import { escapeHtml } from "../html.js";

describe("escapeHtml", () => {
    it("escapes ampersands", () => {
        expect(escapeHtml("A & B")).toBe("A &amp; B");
    });

    it("escapes angle brackets", () => {
        expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("escapes double quotes", () => {
        expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
    });

    it("escapes single quotes", () => {
        expect(escapeHtml("it's")).toBe("it&#39;s");
    });

    it("returns empty string for empty input", () => {
        expect(escapeHtml("")).toBe("");
    });

    it("handles multiple special characters", () => {
        expect(escapeHtml('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
    });
});
