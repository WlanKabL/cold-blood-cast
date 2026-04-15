import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import { mockFeedingsList, mockPets, mockFeedItems } from "./helpers/fixtures";

const pagedFeedings = { items: mockFeedingsList, nextCursor: null };

test.describe("Feedings — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/feedings*", pagedFeedings);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/feed-items", mockFeedItems);
    });

    test("loads and displays feedings", async ({ page }) => {
        await page.goto("/feedings");

        await expect(page.locator("h1")).toContainText(/feeding|fütterung/i, { timeout: 15_000 });
        await expect(page.getByText("Mouse").first()).toBeVisible();
        await expect(page.getByText("Rat").first()).toBeVisible();
    });

    test("shows pet name per feeding", async ({ page }) => {
        await page.goto("/feedings");

        await expect(page.locator("text=Monty").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator("text=Slither").locator("visible=true").first()).toBeVisible();
    });

    test("shows accepted/refused badges", async ({ page }) => {
        await page.goto("/feedings");

        await expect(page.getByText(/accepted|akzeptiert/i).first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText(/refused|verweigert/i).first()).toBeVisible();
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/feedings");

        const addBtn = page.getByRole("button", { name: /log feeding|fütterung|add|hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/feedings");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /log feeding|fütterung|add|hinzufügen/i });
        await addBtn.click();

        await expect(page.getByText(/new feeding|neue fütterung|create/i)).toBeVisible({
            timeout: 10_000,
        });
    });

    test("shows pet filter", async ({ page }) => {
        await page.goto("/feedings");

        const select = page.locator("select").first();
        await expect(select).toBeVisible({ timeout: 15_000 });
        await expect(select.locator("option")).toHaveCount(3); // ALL + 2 pets
    });
});

test.describe("Feedings — Empty State", () => {
    test("shows empty state when no feedings", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/feedings*", { items: [], nextCursor: null });
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/feed-items", mockFeedItems);

        await page.goto("/feedings");

        await expect(page.getByText(/no feeding|keine fütterung|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
