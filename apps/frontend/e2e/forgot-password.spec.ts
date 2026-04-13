import { test, expect } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";
import { mockMutation } from "./helpers/mock-api";

test.describe("Forgot Password Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockNoAuth(page);
    });

    test("renders email input form", async ({ page }) => {
        await page.goto("/forgot-password");

        await expect(page.locator("input[type='email']").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows submit button", async ({ page }) => {
        await page.goto("/forgot-password");

        const submitBtn = page.getByRole("button", {
            name: /send|senden|reset|zurücksetzen|submit/i,
        });
        await expect(submitBtn).toBeVisible({ timeout: 15_000 });
    });

    test("shows login link", async ({ page }) => {
        await page.goto("/forgot-password");

        const loginLink = page.locator("a[href='/login']");
        await expect(loginLink).toBeVisible({ timeout: 15_000 });
    });

    test("submits and shows success", async ({ page }) => {
        await mockMutation(page, "POST", "/api/auth/forgot-password", {});

        await page.goto("/forgot-password");

        const emailInput = page.locator("input[type='email']").first();
        await emailInput.waitFor({ state: "visible", timeout: 15_000 });
        await emailInput.fill("test@example.com");

        const submitBtn = page.getByRole("button", {
            name: /send|senden|reset|zurücksetzen|submit/i,
        });
        await submitBtn.click();

        await expect(
            page.getByText(/check.*email|e-mail.*prüfen|sent|gesendet/i).first(),
        ).toBeVisible({ timeout: 10_000 });
    });
});
