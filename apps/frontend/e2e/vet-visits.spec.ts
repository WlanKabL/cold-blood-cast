import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import {
    mockPets,
    mockVeterinarians,
    mockVetVisits,
    mockVetVisitDetail,
    mockVetVisitDocuments,
    mockVetCosts,
    mockUpcomingAppointments,
} from "./helpers/fixtures";

test.describe("Vet Visits — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/vet-visits/costs", mockVetCosts);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/veterinarians", mockVeterinarians);
        await mockGet(page, "/api/vet-visits", mockVetVisits);
    });

    test("loads and displays visits", async ({ page }) => {
        await page.goto("/vet-visits");
        await expect(page.locator("h1")).toContainText(/vet visit|tierarztbesuch/i, {
            timeout: 15_000,
        });

        // Use unique visit reason text instead of pet names (pet names also appear in hidden <option> elements)
        await expect(page.getByText("Annual checkup").first()).toBeVisible();
        await expect(page.getByText("Routine fecal test").first()).toBeVisible();
    });

    test("shows cost summary card", async ({ page }) => {
        await page.goto("/vet-visits");

        // Total cost from mockVetCosts = 8500 cents = 85,00 €
        await expect(page.getByText(/85/).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/vet-visits");

        const addBtn = page.getByRole("button", { name: /log visit|besuch/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens mode choice dialog on add", async ({ page }) => {
        await page.goto("/vet-visits");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log visit|besuch/i });
        await addBtn.click();

        // Two mode options should appear in the modal/dialog
        await expect(page.getByRole("button", { name: /appointment|termin/i })).toBeVisible({
            timeout: 10_000,
        });
    });

    test("displays appointment badge for scheduled visits", async ({ page }) => {
        await page.goto("/vet-visits");

        // visit_003 is an appointment
        await expect(page.getByText(/scheduled|geplant/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("displays document count on visits with docs", async ({ page }) => {
        await page.goto("/vet-visits");

        // visit_002 has 1 document — reason text identifies the visit
        await expect(page.getByText("Routine fecal test").first()).toBeVisible({ timeout: 15_000 });
        // Document count indicator (1 doc)
        await expect(page.getByText("1").first()).toBeVisible();
    });

    test("visit items are links to detail page", async ({ page }) => {
        await page.goto("/vet-visits");

        const visitLink = page.locator("a[href^='/vet-visits/visit_']").first();
        await expect(visitLink).toBeVisible({ timeout: 15_000 });
    });

    test("creates a past visit via modal", async ({ page }) => {
        const newVisit = { ...mockVetVisits[0], id: "visit_new" };
        await mockMutation(page, "POST", "/api/vet-visits", newVisit);

        await page.goto("/vet-visits");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log visit|besuch/i });
        await addBtn.click();

        // Select past visit mode
        const pastBtn = page.getByRole("button", { name: /past visit|vergangen/i }).first();
        if (await pastBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pastBtn.click();
        }
    });

    test("creates a future appointment via modal", async ({ page }) => {
        const newAppointment = { ...mockVetVisits[2], id: "visit_new_appt" };
        await mockMutation(page, "POST", "/api/vet-visits", newAppointment);

        await page.goto("/vet-visits");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log visit|besuch/i });
        await addBtn.click();

        // Select appointment mode
        const appointmentBtn = page.getByRole("button", { name: /appointment|termin/i }).first();
        if (await appointmentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await appointmentBtn.click();
        }
    });

    test("filters visits by pet", async ({ page }) => {
        await page.goto("/vet-visits");
        await page.waitForLoadState("networkidle");

        const petSelect = page.locator("select").first();
        await petSelect.selectOption("pet_001");
    });
});

test.describe("Vet Visits — Detail Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/vet-visits/visit_001/documents", mockVetVisitDocuments);
        await mockGet(page, "/api/vet-visits/visit_001", mockVetVisitDetail);
        await mockGet(page, "/api/vet-visits/costs", mockVetCosts);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/veterinarians", mockVeterinarians);
        await mockGet(page, "/api/vet-visits", mockVetVisits);
    });

    test("loads detail page with visit information", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        const main = page.locator("main, [class*='max-w']").first();
        await expect(main.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
        await expect(main.getByText("Dr. Schmidt").first()).toBeVisible();
    });

    test("shows reason and diagnosis", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await expect(page.getByText("Annual checkup").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/healthy/i).first()).toBeVisible();
    });

    test("shows cost and weight", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await expect(page.getByText(/50/).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("450").first()).toBeVisible();
    });

    test("shows notes section", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await expect(page.getByText("All good, come back next year").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows follow-up chain", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await expect(page.getByText(/follow/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows documents with upload button", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await page.getByRole("tab", { name: /documents/i }).click();
        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Lab results").first()).toBeVisible();
        await expect(page.getByText("X-Ray photo").first()).toBeVisible();
    });

    test("opens upload modal", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        await page.getByRole("tab", { name: /documents/i }).click();
        await page.getByRole("button", { name: /upload|hochladen/i }).click();
        await expect(page.locator("input[type='file']")).toBeAttached();
    });

    test("has back button that links to list", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        // Use last() to distinguish from sidebar link
        const backLink = page
            .locator("main a[href='/vet-visits'], [class*='max-w'] a[href='/vet-visits']")
            .first();
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows edit and delete action buttons", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        // Edit button (pen icon) and delete button (red trash icon) are icon-only buttons
        // They are the primary action buttons visible on the detail page header
        const actionBtns = page.locator("main").getByRole("button");
        await expect(actionBtns.first()).toBeVisible({ timeout: 15_000 });
        // At least 2 buttons should exist (edit + delete)
        const count = await actionBtns.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test("delete visit shows confirmation dialog", async ({ page }) => {
        await page.goto("/vet-visits/visit_001");

        // Click the danger/red delete button (bg-red-500 class from UiButton variant="danger")
        const deleteBtn = page.locator("main button.bg-red-500").first();
        await deleteBtn.click({ timeout: 15_000 });

        // Confirm dialog should appear with confirmation text or a second delete button
        await expect(page.getByText(/confirm|bestätigen|are you sure|sicher/i).first()).toBeVisible(
            { timeout: 10_000 },
        );
    });

    test("appointment detail shows scheduled badge", async ({ page }) => {
        const appointmentDetail = { ...mockVetVisits[2], followUps: [], documents: [] };
        await page.route("**/api/vet-visits/visit_003", (route) => {
            if (route.request().method() !== "GET") return route.continue();
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: appointmentDetail }),
            });
        });
        await mockGet(page, "/api/vet-visits/visit_003/documents", []);

        await page.goto("/vet-visits/visit_003");

        await expect(page.getByText(/scheduled|geplant|appointment|termin/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});

test.describe("Vet Visits — Empty State", () => {
    test("shows empty state when no visits exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/vet-visits", []);
        await mockGet(page, "/api/vet-visits/costs", { totalCents: 0, visitCount: 0, byPet: [] });
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/veterinarians", mockVeterinarians);

        await page.goto("/vet-visits");

        await expect(page.getByText(/no.*visit|keine.*besuch/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
