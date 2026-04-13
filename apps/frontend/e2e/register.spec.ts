import { test, expect } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";
import { mockMutation } from "./helpers/mock-api";

test.describe("Register Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockNoAuth(page);
        // Mock platform status to allow open registration
        await page.route("**/api/auth/platform-status", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { maintenance: false, registrationMode: "open" },
                }),
            }),
        );
    });

    test("renders registration form", async ({ page }) => {
        await page.goto("/register");

        await expect(page.locator("input[type='text'], input[name*='user']").first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator("input[type='email']").first()).toBeVisible();
        await expect(page.locator("input[type='password']").first()).toBeVisible();
    });

    test("shows login link", async ({ page }) => {
        await page.goto("/register");

        const loginLink = page.locator("a[href='/login']");
        await expect(loginLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows submit button", async ({ page }) => {
        await page.goto("/register");

        const submitBtn = page.getByRole("button", {
            name: /create account|register|registrieren|sign up|konto erstellen/i,
        });
        await expect(submitBtn).toBeVisible({ timeout: 15_000 });
    });
});
