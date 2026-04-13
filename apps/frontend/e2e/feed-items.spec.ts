import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockFeedItems, mockPets } from "./helpers/fixtures";

test.describe("Feed Items — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/feed-items", mockFeedItems);
        await mockGet(page, "/api/pets", mockPets);
    });

    test("loads and displays feed items", async ({ page }) => {
        await page.goto("/feed-items");

        await expect(page.locator("h1")).toContainText(/feed item|futtermittel|food/i, {
            timeout: 15_000,
        });
        await expect(page.getByText("Frozen Mouse").first()).toBeVisible();
        await expect(page.getByText("Frozen Rat").first()).toBeVisible();
    });

    test("shows size and weight", async ({ page }) => {
        await page.goto("/feed-items");

        await expect(page.getByText("Small").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Pinky").first()).toBeVisible();
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/feed-items");

        const addBtn = page.getByRole("button", { name: /add|hinzufügen|new|neu/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/feed-items");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add|hinzufügen|new|neu/i });
        await addBtn.click();

        await expect(page.getByText(/new feed item|neues futtermittel|create/i)).toBeVisible({
            timeout: 10_000,
        });
    });
});

test.describe("Feed Items — Empty State", () => {
    test("shows empty state when no items", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/feed-items", []);
        await mockGet(page, "/api/pets", mockPets);

        await page.goto("/feed-items");

        await expect(page.getByText(/no feed item|kein futtermittel|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
