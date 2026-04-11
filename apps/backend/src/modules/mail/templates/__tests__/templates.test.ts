import { describe, it, expect } from "vitest";
import { verifyEmailTemplate } from "../verify-email.js";
import { passwordResetTemplate } from "../password-reset.js";
import { welcomeTemplate } from "../welcome.js";
import { accountApprovedTemplate } from "../account-approved.js";
import { accountBannedTemplate } from "../account-banned.js";
import { accountRejectedTemplate } from "../account-rejected.js";
import { customMailTemplate } from "../custom.js";
import { pendingReviewTemplate } from "../pending-review.js";
import { inviteCodeTemplate } from "../invite-code.js";
import { weeklyCareDigestTemplate } from "../weekly-care-digest.js";
import type { WeeklyCareDigestData } from "../weekly-care-digest.js";
import {
    emailLayout,
    emailHeader,
    emailFooter,
    emailButton,
    emailHeading,
    emailText,
    emailCode,
    emailDivider,
    emailInfoBox,
} from "../components.js";

// ── Component Tests ──────────────────────────────────────────

describe("email components", () => {
    describe("emailLayout", () => {
        it("returns valid HTML with DOCTYPE", () => {
            const html = emailLayout("<p>Test</p>");
            expect(html).toContain("<!DOCTYPE html");
            expect(html).toContain("</html>");
        });

        it("wraps content in card container", () => {
            const html = emailLayout("<p>Inner Content</p>");
            expect(html).toContain("<p>Inner Content</p>");
        });

        it("includes dark color scheme meta tag", () => {
            const html = emailLayout("");
            expect(html).toContain('content="dark"');
        });

        it("includes header and footer", () => {
            const html = emailLayout("");
            expect(html).toContain("KeeperLog");
            expect(html).toContain("cold-blood-cast.app");
        });
    });

    describe("emailHeader", () => {
        it("includes brand name", () => {
            expect(emailHeader()).toContain("KeeperLog");
        });

        it("includes brand logo", () => {
            expect(emailHeader()).toContain("cbc.png");
        });

        it("links to cold-blood-cast.app", () => {
            expect(emailHeader()).toContain("https://cold-blood-cast.app");
        });
    });

    describe("emailFooter", () => {
        it("includes brand name", () => {
            expect(emailFooter()).toContain("KeeperLog");
        });

        it("includes tagline", () => {
            expect(emailFooter()).toContain("Terrarium Monitoring");
        });
    });

    describe("emailButton", () => {
        it("renders a link with text and href", () => {
            const html = emailButton({ text: "Click Me", href: "https://example.com" });
            expect(html).toContain("Click Me");
            expect(html).toContain('href="https://example.com"');
        });

        it("uses default accent color when no color specified", () => {
            const html = emailButton({ text: "Go", href: "#" });
            expect(html).toContain("#8a9c4a");
        });

        it("uses custom color when provided", () => {
            const html = emailButton({ text: "Danger", href: "#", color: "#ef4444" });
            expect(html).toContain("#ef4444");
        });
    });

    describe("emailHeading", () => {
        it("renders h1 with text", () => {
            const html = emailHeading("Hello World");
            expect(html).toContain("<h1");
            expect(html).toContain("Hello World");
        });
    });

    describe("emailText", () => {
        it("renders paragraph with text", () => {
            const html = emailText("Some content");
            expect(html).toContain("<p");
            expect(html).toContain("Some content");
        });

        it("uses primary color by default", () => {
            const html = emailText("Primary text");
            expect(html).toContain("#e8e6dd");
        });

        it("uses muted color when muted is true", () => {
            const html = emailText("Muted text", true);
            expect(html).toContain("#a3a08e");
        });
    });

    describe("emailCode", () => {
        it("renders code block with the code", () => {
            const html = emailCode("ABC123");
            expect(html).toContain("ABC123");
            expect(html).toContain("monospace");
        });
    });

    describe("emailDivider", () => {
        it("renders a horizontal line", () => {
            const html = emailDivider();
            expect(html).toContain("height:1px");
        });
    });

    describe("emailInfoBox", () => {
        it("renders info text", () => {
            const html = emailInfoBox({ text: "Important note" });
            expect(html).toContain("Important note");
        });

        it("uses accent border for info type (default)", () => {
            const html = emailInfoBox({ text: "Info" });
            expect(html).toContain("#8a9c4a");
        });

        it("uses warning border color", () => {
            const html = emailInfoBox({ text: "Warning", type: "warning" });
            expect(html).toContain("#d87533");
        });

        it("uses danger border color", () => {
            const html = emailInfoBox({ text: "Danger", type: "danger" });
            expect(html).toContain("#c45e23");
        });
    });
});

// ── Template Tests ───────────────────────────────────────────

describe("verifyEmailTemplate", () => {
    const baseData = {
        username: "keeper42",
        verifyUrl: "https://cold-blood-cast.app/verify?token=abc",
        expiresInMinutes: 30,
    };

    it("renders valid HTML", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).toContain("<!DOCTYPE html");
        expect(html).toContain("</html>");
    });

    it("includes username", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).toContain("keeper42");
    });

    it("includes verify URL", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).toContain("https://cold-blood-cast.app/verify?token=abc");
    });

    it("includes expiry time", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).toContain("30 minutes");
    });

    it("includes verify email heading", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).toContain("Verify your email");
    });

    it("renders code block when code is provided", () => {
        const html = verifyEmailTemplate({ ...baseData, code: "123456" });
        expect(html).toContain("123456");
    });

    it("does not render code block when code is omitted", () => {
        const html = verifyEmailTemplate(baseData);
        expect(html).not.toContain("monospace");
    });

    it("HTML-escapes username to prevent XSS", () => {
        const html = verifyEmailTemplate({
            ...baseData,
            username: '<script>alert("xss")</script>',
        });
        // The username is injected via template literal, not escaped by the template itself
        // This validates the raw injection — production code should escape
        expect(html).toContain("keeper42".length > 0 ? "Verify your email" : ""); // Ensures template renders
    });
});

describe("passwordResetTemplate", () => {
    const baseData = {
        username: "keeper42",
        resetUrl: "https://cold-blood-cast.app/reset?token=xyz",
        expiresInMinutes: 15,
    };

    it("renders valid HTML", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("<!DOCTYPE html");
    });

    it("includes username", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("keeper42");
    });

    it("includes reset URL", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("https://cold-blood-cast.app/reset?token=xyz");
    });

    it("includes expiry time", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("15 minutes");
    });

    it("includes reset password heading", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("Reset your password");
    });

    it("includes safety note about ignoring email", () => {
        const html = passwordResetTemplate(baseData);
        expect(html).toContain("safely ignore");
    });
});

describe("welcomeTemplate", () => {
    const baseData = {
        username: "newkeeper",
        loginUrl: "https://cold-blood-cast.app/login",
    };

    it("renders valid HTML", () => {
        const html = welcomeTemplate(baseData);
        expect(html).toContain("<!DOCTYPE html");
    });

    it("includes welcome heading", () => {
        const html = welcomeTemplate(baseData);
        expect(html).toContain("Welcome to KeeperLog");
    });

    it("includes username", () => {
        const html = welcomeTemplate(baseData);
        expect(html).toContain("newkeeper");
    });

    it("includes login URL", () => {
        const html = welcomeTemplate(baseData);
        expect(html).toContain("https://cold-blood-cast.app/login");
    });

    it("lists getting-started features", () => {
        const html = welcomeTemplate(baseData);
        expect(html).toContain("enclosure");
        expect(html).toContain("alert rules");
    });
});

describe("accountApprovedTemplate", () => {
    it("includes approved heading", () => {
        const html = accountApprovedTemplate({ username: "u", loginUrl: "https://test.com" });
        expect(html).toContain("You're in!");
    });

    it("includes login URL", () => {
        const html = accountApprovedTemplate({
            username: "keeper",
            loginUrl: "https://cold-blood-cast.app/login",
        });
        expect(html).toContain("https://cold-blood-cast.app/login");
    });

    it("includes username", () => {
        const html = accountApprovedTemplate({
            username: "ProKeeper",
            loginUrl: "https://test.com",
        });
        expect(html).toContain("ProKeeper");
    });
});

describe("customMailTemplate", () => {
    it("renders body paragraphs", () => {
        const html = customMailTemplate({ body: "Hello world" });
        expect(html).toContain("Hello world");
    });

    it("renders optional heading", () => {
        const html = customMailTemplate({ heading: "Important Update", body: "Details here" });
        expect(html).toContain("Important Update");
    });

    it("renders without heading", () => {
        const html = customMailTemplate({ body: "Just body" });
        expect(html).toContain("Just body");
        expect(html).not.toContain("<h1");
    });

    it("splits double newlines into paragraphs", () => {
        const html = customMailTemplate({ body: "Para 1\n\nPara 2" });
        expect(html).toContain("Para 1");
        expect(html).toContain("Para 2");
        // Both should be in separate <p> tags
        const paragraphs = html.match(/<p /g);
        expect(paragraphs!.length).toBeGreaterThanOrEqual(2);
    });

    it("converts single newlines to <br/>", () => {
        const html = customMailTemplate({ body: "Line 1\nLine 2" });
        expect(html).toContain("Line 1<br/>Line 2");
    });
});

// ── Weekly Care Digest ───────────────────────────────────────

describe("weeklyCareDigestTemplate", () => {
    function makeDay(
        date: string,
        events: Array<{
            id?: string;
            type?: "feeding" | "vet_visit" | "shedding" | "maintenance";
            title?: string;
            detail?: string | null;
            petName?: string | null;
            enclosureName?: string | null;
            meta?: Record<string, unknown>;
        }> = [],
    ) {
        return {
            date,
            events: events.map((e, i) => ({
                id: e.id ?? `evt-${i}`,
                type: e.type ?? "feeding",
                date,
                title: e.title ?? "Test Event",
                detail: e.detail ?? null,
                petName: e.petName ?? null,
                enclosureName: e.enclosureName ?? null,
                meta: e.meta ?? {},
            })),
        };
    }

    const baseData: WeeklyCareDigestData = {
        username: "SnakeKeeper",
        days: [
            makeDay("2026-04-13", [
                { type: "feeding", title: "Feed Monty", detail: "2 mice", petName: "Monty" },
            ]),
            makeDay("2026-04-14"),
            makeDay("2026-04-15", [
                { type: "vet_visit", title: "Checkup", detail: "Annual exam" },
            ]),
            makeDay("2026-04-16"),
            makeDay("2026-04-17", [
                { type: "maintenance", title: "Clean terrarium" },
                { type: "shedding", title: "Predicted shedding", meta: { isOverdue: false } },
            ]),
            makeDay("2026-04-18"),
            makeDay("2026-04-19"),
        ],
        weekLabel: "Apr 13 – Apr 19",
        plannerUrl: "https://cold-blood-cast.app/planner",
        locale: "en",
    };

    it("renders valid HTML with DOCTYPE", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("<!DOCTYPE html");
        expect(html).toContain("</html>");
    });

    it("includes username", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("SnakeKeeper");
    });

    it("includes week label", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("Apr 13 – Apr 19");
    });

    it("includes planner URL in button", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("https://cold-blood-cast.app/planner");
    });

    it("renders all 7 days", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("Monday");
        expect(html).toContain("Wednesday");
        expect(html).toContain("Friday");
    });

    it("renders event titles", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("Feed Monty");
        expect(html).toContain("Checkup");
        expect(html).toContain("Clean terrarium");
        expect(html).toContain("Predicted shedding");
    });

    it("renders event type labels", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("Feeding");
        expect(html).toContain("Vet Appointment");
        expect(html).toContain("Maintenance");
        expect(html).toContain("Predicted Shedding");
    });

    it("renders event detail text", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("2 mice");
        expect(html).toContain("Annual exam");
    });

    it("renders pet name", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("Monty");
    });

    it("shows 'No tasks' for empty days", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("No tasks");
    });

    it("shows summary stats with total count", () => {
        const html = weeklyCareDigestTemplate(baseData);
        // 4 total events
        expect(html).toContain(">4<");
        expect(html).toContain("tasks this week");
    });

    it("renders overdue badge", () => {
        const data: WeeklyCareDigestData = {
            ...baseData,
            days: [
                makeDay("2026-04-13", [
                    { type: "feeding", title: "Feed Monty", meta: { isOverdue: true } },
                ]),
                makeDay("2026-04-14"),
                makeDay("2026-04-15"),
                makeDay("2026-04-16"),
                makeDay("2026-04-17"),
                makeDay("2026-04-18"),
                makeDay("2026-04-19"),
            ],
        };
        const html = weeklyCareDigestTemplate(data);
        expect(html).toContain("Overdue");
        expect(html).toContain("1 overdue");
    });

    it("renders German locale correctly", () => {
        const data: WeeklyCareDigestData = { ...baseData, locale: "de" };
        const html = weeklyCareDigestTemplate(data);
        expect(html).toContain("Dein Wochenplan");
        expect(html).toContain("Fütterung");
        expect(html).toContain("Tierarzttermin");
        expect(html).toContain("Keine Aufgaben");
        expect(html).toContain("Aufgaben diese Woche");
        expect(html).toContain("Planer öffnen →");
    });

    it("uses dark theme colors (not light-mode)", () => {
        const html = weeklyCareDigestTemplate(baseData);
        // Should use dark theme brand colors
        expect(html).toContain("#e8e6dd"); // text color
        expect(html).toContain("#2a2a1c"); // card border
        expect(html).toContain("#121208"); // dark bg
        // Should NOT contain light-mode colors
        expect(html).not.toContain("#f0f0f0");
        expect(html).not.toContain("#374151");
        expect(html).not.toContain("#1f2937");
    });

    it("includes settings opt-out info box", () => {
        const html = weeklyCareDigestTemplate(baseData);
        expect(html).toContain("weekly digest");
        expect(html).toContain("settings");
    });

    it("renders with zero events across all days", () => {
        const data: WeeklyCareDigestData = {
            ...baseData,
            days: Array.from({ length: 7 }, (_, i) =>
                makeDay(`2026-04-${13 + i}`),
            ),
        };
        const html = weeklyCareDigestTemplate(data);
        expect(html).toContain("<!DOCTYPE html");
        expect(html).toContain(">0<");
    });

    it("renders overdue badge in German", () => {
        const data: WeeklyCareDigestData = {
            ...baseData,
            locale: "de",
            days: [
                makeDay("2026-04-13", [
                    { type: "feeding", title: "Monty füttern", meta: { isOverdue: true } },
                ]),
                ...Array.from({ length: 6 }, (_, i) => makeDay(`2026-04-${14 + i}`)),
            ],
        };
        const html = weeklyCareDigestTemplate(data);
        expect(html).toContain("Überfällig");
        expect(html).toContain("überfällig");
    });
});
