import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockWeightRecords, mockPets } from "./helpers/fixtures";

test.describe("Weights — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/weights", mockWeightRecords);
        await mockGet(page, "/api/pets", mockPets);
    });

    test("loads and displays weight records", async ({ page }) => {
        await page.goto("/weights");

        await expect(page.locator("h1")).toContainText(/weight|gewicht/i, { timeout: 15_000 });
        await expect(page.getByText("450").first()).toBeVisible();
    });

    test("shows pet name per weight entry", async ({ page }) => {
        await page.goto("/weights");

        await expect(page.locator("text=Monty").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/weights");

        const addBtn = page.getByRole("button", { name: /log weight|gewicht|add|hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/weights");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log weight|gewicht|add|hinzufügen/i });
        await addBtn.click();

        await expect(page.getByText(/new weight|neues gewicht|create/i)).toBeVisible({
            timeout: 10_000,
        });
    });

    test("shows link to weight chart", async ({ page }) => {
        await page.goto("/weights");

        const chartLink = page.locator("a[href='/weights/chart']");
        await expect(chartLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows pet filter", async ({ page }) => {
        await page.goto("/weights");

        const select = page.locator("select").first();
        await expect(select).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Weights — Empty State", () => {
    test("shows empty state when no records", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/weights", []);
        await mockGet(page, "/api/pets", mockPets);

        await page.goto("/weights");

        await expect(page.getByText(/no weight|kein gewicht|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
