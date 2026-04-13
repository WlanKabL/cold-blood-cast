import { test, expect } from "@playwright/test";
import { mockGet } from "./helpers/mock-api";
import { mockKeeperPetProfile } from "./helpers/fixtures";

test.describe("Keeper Pet Profile — Public Page", () => {
    test.beforeEach(async ({ page }) => {
        // Mock platform status for public pages
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
        await mockGet(page, "/api/public/pets/snake-keeper/monty-the-snake", mockKeeperPetProfile);
        // Mock community endpoints
        await page.route("**/api/public/community/**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { liked: false, count: 0, comments: [] },
                }),
            }),
        );
        // Mock photo/avatar URLs to avoid 404
        await page.route("**/api/public/**/**/photos/**", (route) =>
            route.fulfill({ status: 200, body: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }),
        );
    });

    test("displays pet name", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/p/monty-the-snake");

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows species and morph", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/p/monty-the-snake");

        await expect(page.getByText(/corn snake/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Amel").first()).toBeVisible();
    });

    test("shows bio", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/p/monty-the-snake");

        await expect(
            page.getByText("A friendly corn snake who loves to explore").first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows weight data", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/p/monty-the-snake");

        await expect(page.getByText("450").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows back to keeper link", async ({ page }) => {
        await page.goto("/keeper/snake-keeper/p/monty-the-snake");

        const backLink = page.locator("a[href*='/keeper/snake-keeper']").first();
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });
});
