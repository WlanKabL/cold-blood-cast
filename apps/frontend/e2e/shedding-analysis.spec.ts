import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    mockPets,
    mockEnclosures,
    mockSensors,
    mockFeedings,
    mockFeedingReminders,
    mockUpcomingAppointments,
    mockWeightChartSeries,
    mockGrowthRates,
    mockSheddingAnalysis,
    mockSheddingAnalysisEmpty,
    mockUpcomingSheddings,
    mockTimelinePreview,
} from "./helpers/fixtures";

test.describe("Shedding Analysis — Pet Detail", () => {
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

    test("shows shedding cycle analysis card", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        await expect(page.getByText(/shedding cycle|häutungszyklus/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("displays average interval", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        // Scope to the shedding cycle card to avoid matching the weight range option
        const sheddingCard = page.locator(".glass-card", {
            hasText: /shedding cycle|häutungszyklus/i,
        });
        await expect(sheddingCard).toBeVisible({ timeout: 15_000 });
        await expect(sheddingCard.getByText(/30 days|30 tage/i)).toBeVisible();
    });

    test("displays trend indicator", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        await expect(page.getByText(/stable|stabil/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("displays shedding count", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        await expect(page.getByText(/4 sheddings|4 häutungen/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows empty state for insufficient data", async ({ page }) => {
        await mockGet(page, "/api/sheddings/analysis/pet_001", mockSheddingAnalysisEmpty);

        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        await expect(page.getByText(/not enough|nicht genügend/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});

test.describe("Shedding Analysis — Dashboard Widget", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", mockUpcomingSheddings);
    });

    test("shows upcoming sheddings widget", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        await expect(
            page.getByText(/upcoming sheddings|anstehende häutungen/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays pet name in upcoming sheddings", async ({ page }) => {
        await page.goto("/dashboard");

        // Monty should appear (from mockUpcomingSheddings)
        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows predicted timing badge", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        // "in 5d" or "in 5T" depending on locale
        await expect(page.getByText(/in 5d|in 5T/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("upcoming shedding links to pet detail", async ({ page }) => {
        await page.goto("/dashboard");

        const petLink = page.locator("a[href='/pets/pet_001']");
        await expect(petLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no upcoming sheddings", async ({ page }) => {
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        await expect(page.getByText(/no sheddings predicted|keine häutungen/i).first()).toBeVisible(
            { timeout: 15_000 },
        );
    });
});

test.describe("Shedding Analysis — Anomaly Warning", () => {
    test("shows warning badge when anomaly detected", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets/pet_001", mockPets[0]);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/feedings*", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/weights/growth-rate*", mockGrowthRates);
        await mockGet(page, "/api/vet-visits*", []);
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelinePreview);
        await mockGet(page, "/api/sheddings/analysis/pet_001", {
            ...mockSheddingAnalysis,
            isAnomaly: true,
            anomalyMessage: "Current gap (45d) exceeds average (30d) by more than 30%",
        });

        await page.goto("/pets/pet_001");

        await page.getByRole("tab", { name: /health/i }).click();
        await expect(page.getByText(/overdue|überfällig/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
