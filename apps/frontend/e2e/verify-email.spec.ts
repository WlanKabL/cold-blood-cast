import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { unverifiedUser } from "./helpers/fixtures";

test.describe("Verify Email Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, unverifiedUser);
    });

    test("renders verification code input", async ({ page }) => {
        await page.goto("/verify-email");

        await expect(page.locator("input").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows resend button", async ({ page }) => {
        await page.goto("/verify-email");

        const resendBtn = page.getByRole("button", {
            name: /resend|erneut senden|nochmal/i,
        });
        await expect(resendBtn).toBeVisible({ timeout: 15_000 });
    });
});
