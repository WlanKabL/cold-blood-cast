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
    mockWeightRecords,
    mockVetVisits,
    mockTimelinePreview,
} from "./helpers/fixtures";

// ─── Pet Detail — Weight Chart Section ─────────────────────

test.describe("Pet Detail — Weight Chart", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets/pet_001", mockPets[0]);
        await mockGet(page, "/api/feedings*", []);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(
            page,
            "/api/weights/chart*",
            mockWeightChartSeries.filter((s) => s.petId === "pet_001"),
        );
        await mockGet(page, "/api/weights/growth-rate*", [mockGrowthRates[0]]);
        await mockGet(
            page,
            "/api/vet-visits*",
            mockVetVisits.filter((v) => v.petId === "pet_001"),
        );
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets/pet_001/timeline*", mockTimelinePreview);
    });

    test("shows weight chart section", async ({ page }) => {
        await page.goto("/pets/pet_001");

        await expect(page.getByText(/weight history|gewichtsverlauf/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("displays growth rate indicator", async ({ page }) => {
        await page.goto("/pets/pet_001");

        // Growth rate: 50 g/month, trend up (Gaining)
        await expect(page.getByText(/50 g/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/gaining|zunehmend/i).first()).toBeVisible();
    });

    test("shows total weight gain", async ({ page }) => {
        await page.goto("/pets/pet_001");

        // Total: 250 g
        await expect(page.getByText(/250 g/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows record count", async ({ page }) => {
        await page.goto("/pets/pet_001");

        // 6 records
        await expect(page.getByText("6").first()).toBeVisible({ timeout: 15_000 });
    });

    test("has date range selector", async ({ page }) => {
        await page.goto("/pets/pet_001");

        const select = page.locator("select").last();
        await expect(select).toBeVisible({ timeout: 15_000 });
    });

    test("has view all link", async ({ page }) => {
        await page.goto("/pets/pet_001");

        const viewAllLink = page.locator("main a[href='/weights']");
        await expect(viewAllLink).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Weight Comparison Page ────────────────────────────────

test.describe("Weight Comparison Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/weights/growth-rate*", mockGrowthRates);
    });

    test("loads comparison page with header", async ({ page }) => {
        await page.goto("/weights/chart");

        await expect(page.locator("h1")).toContainText(/comparison|vergleich/i, {
            timeout: 15_000,
        });
    });

    test("shows pet selector buttons", async ({ page }) => {
        await page.goto("/weights/chart");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Slither").first()).toBeVisible();
    });

    test("shows select at least message when no pets selected", async ({ page }) => {
        await page.goto("/weights/chart");

        await expect(page.getByText(/select at least|mindestens/i)).toBeVisible({
            timeout: 15_000,
        });
    });

    test("displays growth rate cards after selecting pets", async ({ page }) => {
        await page.goto("/weights/chart");

        // Click Monty pet selector
        await page.getByText("Monty").first().click();

        // Growth rate card should appear
        await expect(page.getByText(/50 g/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("has date range selector", async ({ page }) => {
        await page.goto("/weights/chart");

        const select = page.locator("select");
        await expect(select).toBeVisible({ timeout: 15_000 });
    });

    test("links back to weight tracking page", async ({ page }) => {
        await page.goto("/weights/chart");

        const backLink = page.locator("main a[href='/weights']");
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Weight Index — Chart Link ─────────────────────────────

test.describe("Weight Index — Chart Link", () => {
    test("shows view chart link on weights page", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/weights", mockWeightRecords);
        await mockGet(page, "/api/pets", mockPets);

        await page.goto("/weights");

        const chartLink = page.locator("a[href='/weights/chart']");
        await expect(chartLink).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Dashboard — Weight Trends Widget ──────────────────────

test.describe("Dashboard — Weight Trends", () => {
    test("shows weight trends section", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);

        await page.goto("/dashboard");

        await expect(page.getByText(/weight trends|gewichtstrends/i)).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows pet sparkline cards with latest weight", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);

        await page.goto("/dashboard");

        // Monty's latest weight: 450 g
        await expect(page.getByText("450 g").first()).toBeVisible({ timeout: 15_000 });
    });

    test("view all links to weight chart comparison", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);

        await page.goto("/dashboard");

        const viewAllLink = page.locator("a[href='/weights/chart']");
        await expect(viewAllLink).toBeVisible({ timeout: 15_000 });
    });
});
