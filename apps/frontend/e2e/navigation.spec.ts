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
} from "./helpers/fixtures";

/**
 * Navigation & layout tests — sidebar links, responsive behavior, global elements.
 */
test.describe("Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/vet-visits", []);
        await mockGet(page, "/api/vet-visits/costs", { totalCents: 0, visitCount: 0, byPet: [] });
        await mockGet(page, "/api/veterinarians", []);
    });

    test("sidebar contains dashboard link", async ({ page }) => {
        await page.goto("/dashboard");

        const dashboardLink = page.locator("a[href='/dashboard']");
        await expect(dashboardLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("sidebar contains pets link", async ({ page }) => {
        await page.goto("/dashboard");

        const petsLink = page.locator("a[href='/pets']");
        await expect(petsLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("sidebar contains enclosures link", async ({ page }) => {
        await page.goto("/dashboard");

        const enclosuresLink = page.locator("a[href='/enclosures']");
        await expect(enclosuresLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("sidebar contains sensors link", async ({ page }) => {
        await page.goto("/dashboard");

        const sensorsLink = page.locator("a[href='/sensors']");
        await expect(sensorsLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("sidebar contains vet visits link", async ({ page }) => {
        await page.goto("/dashboard");

        const vetLink = page.locator("a[href='/vet-visits']");
        await expect(vetLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("navigating from dashboard to pets works", async ({ page }) => {
        await page.goto("/dashboard");

        await page.locator("a[href='/pets']").first().click();
        await expect(page).toHaveURL(/pets/, { timeout: 15_000 });
    });

    test("navigating from dashboard to enclosures works", async ({ page }) => {
        await page.goto("/dashboard");

        await page.locator("a[href='/enclosures']").first().click();
        await expect(page).toHaveURL(/enclosures/, { timeout: 15_000 });
    });

    test("navigating from dashboard to sensors works", async ({ page }) => {
        await page.goto("/dashboard");

        await page.locator("a[href='/sensors']").first().click();
        await expect(page).toHaveURL(/sensors/, { timeout: 15_000 });
    });

    test("navigating from dashboard to vet-visits works", async ({ page }) => {
        await page.goto("/dashboard");

        await page.locator("a[href='/vet-visits']").first().click();
        await expect(page).toHaveURL(/vet-visits/, { timeout: 15_000 });
    });
});
