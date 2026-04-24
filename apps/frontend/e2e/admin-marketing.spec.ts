import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser } from "./helpers/fixtures";

const overviewFixture = {
    totals: {
        landings: 142,
        attributedUsers: 87,
        registrationEvents: 87,
    },
    eventStatusCounts: {
        pending: 1,
        processing: 0,
        sent: 80,
        failed: 2,
        skipped: 4,
    },
    campaigns: [
        {
            utmSource: "meta",
            utmCampaign: "spring2026",
            utmContent: "ad-a",
            signups: 50,
            activated: 30,
            activationRate: 0.6,
        },
        {
            utmSource: "meta",
            utmCampaign: "spring2026",
            utmContent: "ad-b",
            signups: 25,
            activated: 5,
            activationRate: 0.2,
        },
        {
            utmSource: null,
            utmCampaign: null,
            utmContent: null,
            signups: 12,
            activated: 8,
            activationRate: 0.6667,
        },
    ],
    config: {
        metaPixelEnabled: true,
        metaCapiEnabled: true,
        metaCapiDryRun: true,
    },
};

const usersFixture = {
    items: [
        {
            userId: "usr_001",
            username: "alice",
            email: "alice@example.com",
            utmSource: "meta",
            utmCampaign: "spring2026",
            utmContent: "ad-a",
            referrer: "https://facebook.com/",
            boundAt: "2026-04-20T10:00:00.000Z",
        },
        {
            userId: "usr_002",
            username: "bob",
            email: "bob@example.com",
            utmSource: null,
            utmCampaign: null,
            utmContent: null,
            referrer: null,
            boundAt: "2026-04-21T12:00:00.000Z",
        },
    ],
    total: 2,
};

const eventsFixture = {
    items: [
        {
            id: "evt_001",
            eventName: "CompleteRegistration",
            eventSource: "server",
            consentState: "granted",
            status: "sent",
            attemptCount: 1,
            createdAt: "2026-04-20T10:00:00.000Z",
            lastErrorCode: null,
        },
        {
            id: "evt_002",
            eventName: "CompleteRegistration",
            eventSource: "browser",
            consentState: "granted",
            status: "sent",
            attemptCount: 1,
            createdAt: "2026-04-20T10:00:01.000Z",
            lastErrorCode: null,
        },
        {
            id: "evt_003",
            eventName: "CompleteRegistration",
            eventSource: "server",
            consentState: "denied",
            status: "skipped",
            attemptCount: 0,
            createdAt: "2026-04-21T11:00:00.000Z",
            lastErrorCode: null,
        },
    ],
    total: 3,
};

test.describe("Admin Marketing Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/marketing/overview", overviewFixture);
        await mockGet(page, "/api/admin/marketing/users*", usersFixture);
        await mockGet(page, "/api/admin/marketing/events*", eventsFixture);
    });

    test("renders overview KPIs and campaign table", async ({ page }) => {
        await page.goto("/admin/marketing");

        await expect(page.locator("h1")).toContainText(/marketing/i, { timeout: 15_000 });

        // Totals
        await expect(page.getByText("142").first()).toBeVisible();
        await expect(page.getByText("87").first()).toBeVisible();

        // Status counts (sent=80, failed=2, skipped=4)
        await expect(page.getByText("80").first()).toBeVisible();
        await expect(page.getByText("skipped", { exact: false })).toBeVisible();

        // Campaign rows
        await expect(page.getByText("spring2026").first()).toBeVisible();
        await expect(page.getByText("ad-a")).toBeVisible();
        await expect(page.getByText("ad-b")).toBeVisible();
        await expect(page.getByText("60.0%")).toBeVisible(); // activation rate
    });

    test("loads attributed users tab", async ({ page }) => {
        await page.goto("/admin/marketing");

        // Click 2nd tab (Users)
        const usersTab = page.getByRole("tab").nth(1);
        await usersTab.click();

        await expect(page.getByText("alice")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("bob")).toBeVisible();
        await expect(page.getByText("alice@example.com")).toBeVisible();
    });

    test("loads events tab including skipped (denied consent)", async ({ page }) => {
        await page.goto("/admin/marketing");

        const eventsTab = page.getByRole("tab").nth(2);
        await eventsTab.click();

        // Both server + browser sent rows
        await expect(page.getByText("server").first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("browser").first()).toBeVisible();

        // Skipped row proves consent matrix audit row exists
        await expect(page.getByText("skipped").first()).toBeVisible();
        await expect(page.getByText("denied").first()).toBeVisible();
    });
});
