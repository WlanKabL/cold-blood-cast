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
    mockUpcomingSheddings,
} from "./helpers/fixtures";

test.describe("Dashboard", () => {
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

    test("loads dashboard page", async ({ page }) => {
        await page.goto("/dashboard");

        await expect(page.locator("h1")).toContainText(/dashboard|übersicht/i, { timeout: 15_000 });
    });

    test("shows stat cards with correct counts", async ({ page }) => {
        await page.goto("/dashboard");

        // Enclosures: 2 (mockEnclosures has 2 items)
        await expect(page.getByText("2").first()).toBeVisible({ timeout: 15_000 });

        // Pets: 2 (mockPets has Monty + Slither)
        await expect(page.getByText("2").first()).toBeVisible();
    });

    test("shows enclosure overview section", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(page.getByText("Main Vivarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("enclosure card links to detail page", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        const enclosureLink = page.locator("a[href='/enclosures/enc_001']");
        await expect(enclosureLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows upcoming vet visits section", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        // mockUpcomingAppointments has visit_003 with pet Monty
        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Dr. Schmidt").first()).toBeVisible();
    });

    test("vet visit card links to detail page", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        const vetLink = page.locator("a[href='/vet-visits/visit_003']");
        await expect(vetLink).toBeVisible({ timeout: 15_000 });
    });

    test("view all leads to vet-visits page", async ({ page }) => {
        await page.goto("/dashboard");

        const viewAllLink = page.locator("a[href='/vet-visits']").last();
        await expect(viewAllLink).toBeVisible({ timeout: 15_000 });
    });

    test("view all enclosures link exists", async ({ page }) => {
        await page.goto("/dashboard");

        const viewAllLink = page.locator("a[href='/enclosures']").last();
        await expect(viewAllLink).toBeVisible({ timeout: 15_000 });
    });

    test("view all feedings link exists", async ({ page }) => {
        await page.goto("/dashboard");

        const viewAllLink = page.locator("a[href='/feedings']").last();
        await expect(viewAllLink).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Dashboard — Empty State", () => {
    test("shows empty state for enclosures", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", []);
        await mockGet(page, "/api/pets", []);
        await mockGet(page, "/api/sensors", []);
        await mockGet(page, "/api/feedings", []);
        await mockGet(page, "/api/feeding-reminders", []);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", []);
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        // Empty state for enclosures should show text
        await expect(page.getByText(/no enclosures/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state for upcoming vet visits", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", mockUpcomingSheddings);

        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /schedule/i }).click();
        // No upcoming vet visits text
        await expect(page.getByText(/no upcoming/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows zero counts when everything is empty", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", []);
        await mockGet(page, "/api/pets", []);
        await mockGet(page, "/api/sensors", []);
        await mockGet(page, "/api/feedings", []);
        await mockGet(page, "/api/feeding-reminders", []);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", []);
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        // All stat cards should show 0
        const zeros = page.locator(".text-xl.font-bold", { hasText: "0" });
        await expect(zeros).toHaveCount(4, { timeout: 15_000 });
    });
});

test.describe("Dashboard — Feeding Reminders", () => {
    test("shows feeding reminders with status badges", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", [
            {
                petId: "pet_001",
                petName: "Monty",
                species: "corn_snake",
                intervalMinDays: 7,
                intervalMaxDays: 10,
                lastFedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                daysSinceLastFeeding: 5,
                status: "ok",
            },
            {
                petId: "pet_002",
                petName: "Slither",
                species: "corn_snake",
                intervalMinDays: 7,
                intervalMaxDays: 10,
                lastFedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
                daysSinceLastFeeding: 14,
                status: "critical",
            },
        ]);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", mockUpcomingSheddings);

        await page.goto("/dashboard");

        // Pet names in feeding reminders
        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Slither").first()).toBeVisible();
    });
});

test.describe("Dashboard — Quick Actions", () => {
    const feedingRemindersWithPets = [
        {
            petId: "pet_001",
            petName: "Monty",
            species: "corn_snake",
            intervalMinDays: 7,
            intervalMaxDays: 10,
            lastFedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
            daysSinceLastFeeding: 8,
            status: "due",
        },
    ];

    test("shows quick feed button on feeding status card", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", feedingRemindersWithPets);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });

        // Quick feed button should be visible
        const quickFeedBtn = page.getByTitle(/quick log feeding|schnell fütterung/i).first();
        await expect(quickFeedBtn).toBeVisible();
    });

    test("shows quick weight button on feeding status card", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", feedingRemindersWithPets);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });

        // Quick weight button should be visible
        const quickWeightBtn = page.getByTitle(/quick log weight|schnell gewicht/i).first();
        await expect(quickWeightBtn).toBeVisible();
    });

    test("opens quick feeding modal", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", feedingRemindersWithPets);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", []);
        await mockGet(page, "/api/feed-items", []);

        await page.goto("/dashboard");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });

        await page
            .getByTitle(/quick log feeding|schnell fütterung/i)
            .first()
            .click();

        // Modal should appear with pet name
        await expect(page.getByText(/monty/i, { exact: false }).first()).toBeVisible({
            timeout: 5_000,
        });
    });

    test("opens quick weight modal", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", feedingRemindersWithPets);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/weights/chart*", mockWeightChartSeries);
        await mockGet(page, "/api/sheddings/upcoming", []);

        await page.goto("/dashboard");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });

        await page
            .getByTitle(/quick log weight|schnell gewicht/i)
            .first()
            .click();

        // Modal should appear with weight input
        await expect(page.getByText(/monty/i, { exact: false }).first()).toBeVisible({
            timeout: 5_000,
        });
    });
});
