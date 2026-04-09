import { describe, it, expect } from "vitest";
import { escapeHtml } from "../html-escape.js";

describe("escapeHtml", () => {
    it("escapes & to &amp;", () => {
        expect(escapeHtml("a&b")).toBe("a&amp;b");
    });

    it("escapes < and > to &lt; and &gt;", () => {
        expect(escapeHtml("<script>alert('xss')</script>")).toBe(
            "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
        );
    });

    it("escapes double quotes", () => {
        expect(escapeHtml('a"b')).toBe("a&quot;b");
    });

    it("escapes single quotes", () => {
        expect(escapeHtml("a'b")).toBe("a&#39;b");
    });

    it("handles empty string", () => {
        expect(escapeHtml("")).toBe("");
    });

    it("does not alter safe strings", () => {
        const safe = "Hello World 123";
        expect(escapeHtml(safe)).toBe(safe);
    });

    it("escapes multiple occurrences", () => {
        expect(escapeHtml("a&b&c")).toBe("a&amp;b&amp;c");
    });

    it("handles complex user-agent strings with script injection", () => {
        const malicious = 'Mozilla/5.0 <img onerror="alert(1)" src=x>';
        const escaped = escapeHtml(malicious);
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
        expect(escaped).not.toContain('"');
    });
});
