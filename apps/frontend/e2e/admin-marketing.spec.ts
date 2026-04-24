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

    // ── V3 tabs ──────────────────────────────────────────────────

    test("Reports tab renders ROI KPIs and per-campaign rows (V3)", async ({ page }) => {
        await page.route("**/api/admin/marketing/reports/roi*", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        activationWindowDays: 7,
                        cohortFrom: null,
                        cohortTo: null,
                        totals: {
                            signups: 87,
                            activated: 38,
                            highValueEvents: 12,
                            revenue: 599.88,
                            currency: "EUR",
                        },
                        campaigns: [
                            {
                                utmSource: "meta",
                                utmCampaign: "spring2026",
                                utmContent: "ad-a",
                                signups: 50,
                                activated: 30,
                                activationRate: 0.6,
                                highValueEvents: 10,
                                revenue: 499.9,
                                currency: "EUR",
                                revenuePerSignup: 9.998,
                            },
                            {
                                utmSource: "google",
                                utmCampaign: "brand",
                                utmContent: "kw-1",
                                signups: 25,
                                activated: 5,
                                activationRate: 0.2,
                                highValueEvents: 2,
                                revenue: 99.98,
                                currency: "EUR",
                                revenuePerSignup: 3.999,
                            },
                        ],
                    },
                }),
            }),
        );

        await page.goto("/admin/marketing");
        await page.getByRole("tab").nth(5).click(); // Reports

        // KPI cards
        await expect(page.getByText("87").first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("38").first()).toBeVisible();
        // Per-campaign rows
        await expect(page.getByText("spring2026")).toBeVisible();
        await expect(page.getByText("brand")).toBeVisible();
    });

    test("Audiences tab lists exports, downloads, and creates a new export (V3)", async ({
        page,
    }) => {
        const audienceList = {
            items: [
                {
                    id: "aex_existing",
                    name: "EU activated April",
                    format: "csv",
                    status: "ready",
                    rowCount: 142,
                    filter: { activatedOnly: true },
                    error: null,
                    createdById: "admin",
                    createdAt: "2026-04-22T09:00:00.000Z",
                    expiresAt: "2026-05-22T09:00:00.000Z",
                    downloadUrl:
                        "/api/admin/marketing/audience-exports/download/tok_existing",
                },
            ],
        };
        await page.route("**/api/admin/marketing/audience-exports", (route) => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: audienceList }),
                });
            }
            // POST → simulate a new export being created
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: "aex_new",
                        name: "Spring meta clicks",
                        format: "csv",
                        status: "ready",
                        rowCount: 50,
                        filter: { utmSource: "meta" },
                        error: null,
                        createdById: "admin",
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
                        downloadUrl:
                            "/api/admin/marketing/audience-exports/download/tok_new",
                    },
                }),
            });
        });

        await page.goto("/admin/marketing");
        await page.getByRole("tab").nth(6).click(); // Audiences

        await expect(page.getByText("EU activated April")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("142")).toBeVisible();
        // Download link must be present and tokenised (not raw email content).
        const dl = page.getByRole("link").filter({ hasText: /download|herunterladen/i }).first();
        await expect(dl).toHaveAttribute("href", /\/audience-exports\/download\/tok_existing/);
    });

    test("Settings tab exposes activationWindowDays input (V3)", async ({ page }) => {
        await page.route("**/api/admin/marketing/settings", (route) => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        success: true,
                        data: {
                            metaPixelEnabled: true,
                            metaPixelId: "12345",
                            metaCapiEnabled: true,
                            metaCapiDryRun: true,
                            metaTestEventCode: null,
                            activationWindowDays: 7,
                            overrides: {
                                "marketing.metaPixelEnabled": false,
                                "marketing.metaCapiEnabled": false,
                                "marketing.metaCapiDryRun": false,
                                "marketing.metaPixelId": false,
                                "marketing.metaTestEventCode": false,
                                "marketing.activationWindowDays": false,
                            },
                        },
                    }),
                });
            }
            return route.fallback();
        });

        await page.goto("/admin/marketing");
        await page.getByRole("tab").nth(3).click(); // Settings

        // Activation window input must render with the resolved env value as placeholder.
        const input = page.locator("input[type='number'][placeholder='7']").first();
        await expect(input).toBeVisible({ timeout: 10_000 });
    });
});
