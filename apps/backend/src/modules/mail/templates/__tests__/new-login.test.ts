import { describe, it, expect } from "vitest";
import { newLoginTemplate } from "../new-login.js";

describe("newLoginTemplate", () => {
    const baseData = {
        username: "keeper42",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        timestamp: "2026-03-26 14:00:00 UTC",
    };

    it("renders HTML with all data fields", () => {
        const html = newLoginTemplate(baseData);
        expect(html).toContain("keeper42");
        expect(html).toContain("192.168.1.1");
        expect(html).toContain("2026-03-26 14:00:00 UTC");
        expect(html).toContain("New Login Detected");
    });

    it("HTML-escapes username to prevent XSS", () => {
        const data = { ...baseData, username: '<script>alert("xss")</script>' };
        const html = newLoginTemplate(data);
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    it("HTML-escapes user agent to prevent XSS", () => {
        const data = { ...baseData, userAgent: '<img onerror="alert(1)" src=x>' };
        const html = newLoginTemplate(data);
        expect(html).not.toContain("<img onerror");
        expect(html).toContain("&lt;img");
    });

    it("HTML-escapes IP address", () => {
        const data = { ...baseData, ipAddress: '"><script>xss</script>' };
        const html = newLoginTemplate(data);
        expect(html).not.toContain("<script>xss</script>");
    });

    it("contains warning about unauthorized access", () => {
        const html = newLoginTemplate(baseData);
        expect(html).toContain("change your password");
    });

    it("returns valid HTML structure", () => {
        const html = newLoginTemplate(baseData);
        expect(html).toContain("<!DOCTYPE html");
        expect(html).toContain("</html>");
    });
});
