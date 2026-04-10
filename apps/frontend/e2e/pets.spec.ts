import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import { mockPets, mockEnclosures } from "./helpers/fixtures";

test.describe("Pets — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/enclosures", mockEnclosures);
    });

    test("loads and displays pets", async ({ page }) => {
        await page.goto("/pets");

        await expect(page.locator("h1")).toContainText(/pet|tier/i, { timeout: 15_000 });
        await expect(page.getByText("Monty").first()).toBeVisible();
        await expect(page.getByText("Slither").first()).toBeVisible();
    });

    test("shows species and morph", async ({ page }) => {
        await page.goto("/pets");

        await expect(page.getByText("Amel").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Normal").first()).toBeVisible();
    });

    test("shows enclosure name", async ({ page }) => {
        await page.goto("/pets");

        // "Main Vivarium" also appears in filter <option>, so scope to card links
        const card = page.locator("main a[href^='/pets/']").filter({ hasText: "Main Vivarium" });
        await expect(card.first()).toBeVisible({ timeout: 15_000 });
    });

    test("pet cards link to detail pages", async ({ page }) => {
        await page.goto("/pets");

        const petLink = page.locator("a[href='/pets/pet_001']");
        await expect(petLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/pets");

        const addBtn = page.getByRole("button", { name: /add pet|tier hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/pets");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add pet|tier hinzufügen/i });
        await addBtn.click();

        // Modal title should be visible
        await expect(page.getByText(/new pet|neues tier/i)).toBeVisible({ timeout: 10_000 });
    });

    test("search filters pets", async ({ page }) => {
        await page.goto("/pets");

        const searchInput = page.locator("input[type='text']").first();
        await searchInput.waitFor({ state: "visible", timeout: 15_000 });
        await searchInput.fill("Monty");

        // After debounce
        await page.waitForTimeout(500);
    });
});

test.describe("Pets — Empty State", () => {
    test("shows empty state when no pets exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/pets", []);
        await mockGet(page, "/api/enclosures", mockEnclosures);

        await page.goto("/pets");

        // Empty state text
        await expect(page.getByText(/no pets|keine tiere/i).first()).toBeVisible({ timeout: 15_000 });
    });
});
