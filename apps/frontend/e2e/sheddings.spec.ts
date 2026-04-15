import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockSheddingsList, mockPets } from "./helpers/fixtures";

const pagedSheddings = { items: mockSheddingsList, nextCursor: null };

test.describe("Sheddings — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/sheddings*", pagedSheddings);
        await mockGet(page, "/api/pets", mockPets);
    });

    test("loads and displays sheddings", async ({ page }) => {
        await page.goto("/sheddings");

        await expect(page.locator("h1")).toContainText(/shedding|häutung/i, { timeout: 15_000 });
        await expect(page.locator("text=Monty").locator("visible=true").first()).toBeVisible();
    });

    test("shows completion status badges", async ({ page }) => {
        await page.goto("/sheddings");

        // Complete vs incomplete
        await expect(page.getByText(/complete|vollständig|good/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows in-progress shedding", async ({ page }) => {
        await page.goto("/sheddings");

        await expect(page.locator("text=Slither").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText(/blue phase|in progress|laufend/i).first()).toBeVisible();
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/sheddings");

        const addBtn = page.getByRole("button", { name: /log shedding|häutung|add|hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/sheddings");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log shedding|häutung|add|hinzufügen/i });
        await addBtn.click();

        await expect(page.getByText(/new shedding|neue häutung|create/i)).toBeVisible({
            timeout: 10_000,
        });
    });

    test("shows pet filter", async ({ page }) => {
        await page.goto("/sheddings");

        const select = page.locator("select").first();
        await expect(select).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Sheddings — Empty State", () => {
    test("shows empty state when no sheddings", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/sheddings*", { items: [], nextCursor: null });
        await mockGet(page, "/api/pets", mockPets);

        await page.goto("/sheddings");

        await expect(page.getByText(/no shedding|keine häutung|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
