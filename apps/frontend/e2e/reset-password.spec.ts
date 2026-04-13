import { test, expect } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";

test.describe("Reset Password Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockNoAuth(page);
    });

    test("shows error when no token", async ({ page }) => {
        await page.goto("/reset-password");

        await expect(
            page.getByText(/invalid|ungültig|no token|kein token|expired|abgelaufen/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("renders password form with valid token", async ({ page }) => {
        await page.goto("/reset-password?token=valid-token-123");

        await expect(page.locator("input[type='password']").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows submit button with valid token", async ({ page }) => {
        await page.goto("/reset-password?token=valid-token-123");

        const submitBtn = page.getByRole("button", {
            name: /reset|zurücksetzen|save|speichern|submit/i,
        });
        await expect(submitBtn).toBeVisible({ timeout: 15_000 });
    });
});
