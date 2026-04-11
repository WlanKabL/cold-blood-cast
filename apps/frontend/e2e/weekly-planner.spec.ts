import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";

// ─── Mock Data ──────────────────────────────────────────

const mockPlannerWeek = [
    {
        date: "2026-04-13",
        events: [
            {
                id: "feeding-pet_1",
                type: "feeding",
                date: "2026-04-13",
                title: "Noodle",
                detail: "7–10d",
                petName: "Noodle",
                enclosureName: null,
                meta: { petId: "pet_1", status: "due", intervalMin: 7, intervalMax: 10 },
            },
            {
                id: "maintenance-task_1",
                type: "maintenance",
                date: "2026-04-13",
                title: "Change water",
                detail: "Desert Terrarium",
                petName: null,
                enclosureName: "Desert Terrarium",
                meta: { taskId: "task_1", maintenanceType: "WATER_CHANGE", isOverdue: true },
            },
        ],
    },
    { date: "2026-04-14", events: [] },
    {
        date: "2026-04-15",
        events: [
            {
                id: "vet-vet_1",
                type: "vet_visit",
                date: "2026-04-15",
                title: "Noodle",
                detail: "Checkup",
                petName: "Noodle",
                enclosureName: null,
                meta: { vetVisitId: "vet_1", vetName: "Dr. Reptile", reason: "Checkup" },
            },
        ],
    },
    { date: "2026-04-16", events: [] },
    {
        date: "2026-04-17",
        events: [
            {
                id: "shedding-pet_1",
                type: "shedding",
                date: "2026-04-17",
                title: "Noodle",
                detail: "~28d",
                petName: "Noodle",
                enclosureName: null,
                meta: { petId: "pet_1", averageInterval: 28, trend: "stable" },
            },
        ],
    },
    { date: "2026-04-18", events: [] },
    { date: "2026-04-19", events: [] },
];

const mockPlannerEmpty = [
    { date: "2026-04-13", events: [] },
    { date: "2026-04-14", events: [] },
    { date: "2026-04-15", events: [] },
    { date: "2026-04-16", events: [] },
    { date: "2026-04-17", events: [] },
    { date: "2026-04-18", events: [] },
    { date: "2026-04-19", events: [] },
];

// ─── Weekly Planner Page ─────────────────────────────────

test.describe("Weekly Planner — Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/planner/week*", mockPlannerWeek);
    });

    test("shows page title", async ({ page }) => {
        await page.goto("/planner");

        await expect(
            page.getByText(/weekly care planner|wochenplaner/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays 7 day columns", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Noodle").first()).toBeVisible({ timeout: 15_000 });

        // Check we have day names visible (Mon, Tue, ... or Mo, Di, ...)
        const dayCards = page.locator(".glass-card");
        await expect(dayCards).toHaveCount(7);
    });

    test("shows feeding events", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Noodle").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("7–10d").first()).toBeVisible();
    });

    test("shows vet visit events", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Checkup").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows shedding predictions", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("~28d").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows maintenance events with overdue badge", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Change water").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/overdue|überfällig/i).first()).toBeVisible();
    });

    test("shows empty day message", async ({ page }) => {
        await page.goto("/planner");

        // Wait for data to load
        await expect(page.getByText("Noodle").first()).toBeVisible({ timeout: 15_000 });

        // Empty days should show "No tasks" message
        await expect(page.getByText(/no tasks|keine aufgaben/i).first()).toBeVisible();
    });

    test("shows event count badges", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Noodle").first()).toBeVisible({ timeout: 15_000 });

        // Monday has 2 events
        await expect(page.getByText("2").first()).toBeVisible();
    });

    test("shows legend with event types", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText("Noodle").first()).toBeVisible({ timeout: 15_000 });

        await expect(page.getByText(/feeding|fütterung/i).first()).toBeVisible();
        await expect(page.getByText(/vet visit|tierarztbesuch/i).first()).toBeVisible();
        await expect(page.getByText(/shedding|häutung/i).first()).toBeVisible();
        await expect(page.getByText(/maintenance|wartung/i).first()).toBeVisible();
    });
});

test.describe("Weekly Planner — Empty State", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/planner/week*", mockPlannerEmpty);
    });

    test("shows empty state for all days", async ({ page }) => {
        await page.goto("/planner");

        const emptyMessages = page.getByText(/no tasks|keine aufgaben/i);
        await expect(emptyMessages.first()).toBeVisible({ timeout: 15_000 });
        await expect(emptyMessages).toHaveCount(7);
    });
});

test.describe("Weekly Planner — Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/planner/week*", mockPlannerWeek);
    });

    test("has week navigation buttons", async ({ page }) => {
        await page.goto("/planner");

        await expect(page.getByText(/today|heute/i).first()).toBeVisible({ timeout: 15_000 });
    });
});
