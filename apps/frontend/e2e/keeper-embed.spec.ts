import { test, expect } from "@playwright/test";
import { mockGet } from "./helpers/mock-api";
import { mockPublicUserData } from "./helpers/fixtures";

test.describe("Keeper Embed — Public Widget", () => {
    test.beforeEach(async ({ page }) => {
        await page.route("**/api/auth/platform-status", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { maintenance: false } }),
            }),
        );
        await page.route("**/api/auth/refresh", (route) =>
            route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
        );
        await mockGet(page, "/api/public/users/snake-keeper", mockPublicUserData);
        // Mock avatar
        await page.route("**/api/public/users/snake-keeper/avatar**", (route) =>
            route.fulfill({ status: 200, body: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }),
        );
    });

    test("displays user display name", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/embed");

        await expect(page.getByText("SnakeKeeper").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows pet list", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/embed");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows stats", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/embed");

        // Pet count or other stats
        await expect(page.getByText("3").first()).toBeVisible({ timeout: 15_000 });
    });
});
