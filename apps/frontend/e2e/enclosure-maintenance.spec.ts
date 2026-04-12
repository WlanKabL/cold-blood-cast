import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation, mockDelete } from "./helpers/mock-api";
import {
    mockEnclosures,
    mockMaintenanceTasks,
    mockOverdueMaintenanceTasks,
    mockMaintenanceEmpty,
} from "./helpers/fixtures";

// ─── Maintenance List Page ───────────────────────────────

test.describe("Enclosure Maintenance — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosure-maintenance/overdue", mockOverdueMaintenanceTasks);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/enclosure-maintenance", mockMaintenanceTasks);
    });

    test("shows page title", async ({ page }) => {
        await page.goto("/maintenance");

        await expect(
            page.getByText(/enclosure maintenance|terrarium-wartung/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays maintenance tasks", async ({ page }) => {
        await page.goto("/maintenance");

        await expect(page.getByText("Full terrarium cleaning").first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText("Replace aspen bedding").first()).toBeVisible();
        await expect(page.getByText("Replace UVB bulb").first()).toBeVisible();
    });

    test("shows enclosure name on task cards", async ({ page }) => {
        await page.goto("/maintenance");

        await expect(page.getByText("Desert Terrarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows overdue badge on overdue tasks", async ({ page }) => {
        await page.goto("/maintenance");

        // Task mt_001 has nextDueAt in the past
        await expect(page.getByText(/overdue|überfällig/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows recurring badge on recurring tasks", async ({ page }) => {
        await page.goto("/maintenance");

        await expect(page.getByText(/recurring|wiederkehrend/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/maintenance");

        const addBtn = page.getByRole("button", { name: /add task|aufgabe hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add button click", async ({ page }) => {
        await page.goto("/maintenance");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add task|aufgabe hinzufügen/i });
        await addBtn.click();

        await expect(
            page.getByText(/new maintenance task|neue wartungsaufgabe/i).first(),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("shows mark-done buttons", async ({ page }) => {
        await page.goto("/maintenance");

        const markDoneBtn = page.getByRole("button", { name: /mark as done|als erledigt/i });
        await expect(markDoneBtn.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no tasks", async ({ page }) => {
        await mockGet(page, "/api/enclosure-maintenance", mockMaintenanceEmpty);

        await page.goto("/maintenance");

        await expect(
            page.getByText(/no maintenance tasks|noch keine wartungsaufgaben/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("complete task mutation works", async ({ page }) => {
        await mockMutation(page, "POST", "/api/enclosure-maintenance/mt_001/complete", {
            ...mockMaintenanceTasks[0],
            completedAt: "2026-04-11T10:00:00.000Z",
        });

        await page.goto("/maintenance");

        const markDoneBtn = page.getByRole("button", { name: /mark as done|als erledigt/i });
        await expect(markDoneBtn.first()).toBeVisible({ timeout: 15_000 });
        await markDoneBtn.first().click();

        // After completion, page should refetch (toast appears)
        await expect(page.getByText(/completed|erledigt/i).first()).toBeVisible({
            timeout: 10_000,
        });
    });
});

// ─── Maintenance on Dashboard ────────────────────────────

test.describe("Enclosure Maintenance — Dashboard Widget", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", []);
        await mockGet(page, "/api/sensors", []);
        await mockGet(page, "/api/feedings*", []);
        await mockGet(page, "/api/feeding-reminders", []);
        await mockGet(page, "/api/vet-visits/upcoming", []);
        await mockGet(page, "/api/vet-visits/costs*", { totalCents: 0, perPet: [], perVet: [] });
        await mockGet(page, "/api/weights/chart*", []);
        await mockGet(page, "/api/weights/growth-rate*", []);
        await mockGet(page, "/api/sheddings/upcoming", []);
        await mockGet(page, "/api/enclosure-maintenance/overdue", mockOverdueMaintenanceTasks);
    });

    test("shows overdue maintenance section", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(
            page.getByText(/overdue maintenance|überfällige wartung/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays overdue task details", async ({ page }) => {
        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(page.getByText("Desert Terrarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no overdue tasks", async ({ page }) => {
        await mockGet(page, "/api/enclosure-maintenance/overdue", []);

        await page.goto("/dashboard");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(
            page.getByText(/all maintenance tasks are up to date|alle wartungsaufgaben/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Maintenance on Enclosure Detail ─────────────────────

test.describe("Enclosure Maintenance — Enclosure Detail Section", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures/enc_001", {
            ...mockEnclosures[0],
            pets: [],
            sensors: [],
        });
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/enclosure-maintenance?enclosureId=enc_001", mockMaintenanceTasks);
    });

    test("shows maintenance section on enclosure detail", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(page.getByText(/maintenance tasks|wartungsaufgaben/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("displays task type or description", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        await expect(page.getByText("Full terrarium cleaning").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows overdue count badge", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await page.getByRole("tab", { name: /maintenance/i }).click();
        // At least one overdue task badge
        await expect(page.getByText(/overdue|überfällig/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
