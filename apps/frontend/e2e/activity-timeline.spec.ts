import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    mockPets,
    mockEnclosures,
    mockFeedings,
    mockFeedingReminders,
    mockWeightChartSeries,
    mockGrowthRates,
    mockSheddingAnalysis,
    mockTimelineEvents,
    mockTimelineEmpty,
    mockTimelinePreview,
} from "./helpers/fixtures";

// ─── Timeline Page ───────────────────────────────────────

test.describe("Activity Timeline — Full Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets/pet_001", mockPets[0]);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelineEvents);
    });

    test("shows timeline page title", async ({ page }) => {
        await page.goto("/pets/pet_001/timeline");

        await expect(
            page.getByText(/activity timeline|aktivitäts-chronik/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays events from all types", async ({ page }) => {
        await page.goto("/pets/pet_001/timeline");

        // Wait for first event to appear
        await expect(page.getByText("Mouse (Small)").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("350g").first()).toBeVisible();
        await expect(page.getByText("Annual checkup").first()).toBeVisible();
        await expect(page.getByText("Basking").first()).toBeVisible();
    });

    test("shows type filter buttons", async ({ page }) => {
        await page.goto("/pets/pet_001/timeline");

        await expect(
            page.getByText(/feedings|fütterungen/i).first(),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByText(/sheddings|häutungen/i).first(),
        ).toBeVisible();
        await expect(
            page.getByText(/weights|gewicht/i).first(),
        ).toBeVisible();
    });

    test("shows empty state when no events", async ({ page }) => {
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelineEmpty);

        await page.goto("/pets/pet_001/timeline");

        await expect(
            page.getByText(/no events|noch keine ereignisse/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows back link to pet detail", async ({ page }) => {
        await page.goto("/pets/pet_001/timeline");

        const backLink = page.locator("a[href='/pets/pet_001']");
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows pet name in header", async ({ page }) => {
        await page.goto("/pets/pet_001/timeline");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Pet Detail — Recent Activity ────────────────────────

test.describe("Activity Timeline — Pet Detail Widget", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets/pet_001", mockPets[0]);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/feedings*", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/weights/growth-rate*", mockGrowthRates);
        await mockGet(page, "/api/vet-visits*", []);
        await mockGet(page, "/api/sheddings/analysis/pet_001", mockSheddingAnalysis);
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelinePreview);
    });

    test("shows recent activity section", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await expect(
            page.getByText(/recent activity|letzte aktivität/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows view timeline link", async ({ page }) => {
        await page.goto("/pets/pet_001");

        const timelineLink = page.locator("a[href='/pets/pet_001/timeline']");
        await expect(timelineLink).toBeVisible({ timeout: 15_000 });
    });

    test("displays recent events", async ({ page }) => {
        await page.goto("/pets/pet_001");

        // mockTimelinePreview has "Mouse (Small)" as first event
        const activityCard = page.locator(".glass-card", {
            hasText: /recent activity|letzte aktivität/i,
        });
        await expect(activityCard).toBeVisible({ timeout: 15_000 });
        await expect(activityCard.getByText("Mouse (Small)")).toBeVisible();
    });

    test("shows empty state when no events", async ({ page }) => {
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelineEmpty);

        await page.goto("/pets/pet_001");

        const activityCard = page.locator(".glass-card", {
            hasText: /recent activity|letzte aktivität/i,
        });
        await expect(activityCard).toBeVisible({ timeout: 15_000 });
        await expect(
            activityCard.getByText(/no events|noch keine ereignisse/i),
        ).toBeVisible();
    });
});
