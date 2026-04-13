import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminNotificationSettings } from "./helpers/fixtures";

test.describe("Admin Notifications", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/settings", mockAdminNotificationSettings);
    });

    test("displays notification settings page", async ({ page }) => {
        await page.goto("/admin/notifications");

        await expect(page.getByText(/notification|benachrichtigung/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows Telegram channel toggle", async ({ page }) => {
        await page.goto("/admin/notifications");

        await expect(page.getByText(/telegram/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows Discord channel toggle", async ({ page }) => {
        await page.goto("/admin/notifications");

        await expect(page.getByText(/discord/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows event toggles", async ({ page }) => {
        await page.goto("/admin/notifications");

        // Wait for the events section to load
        await expect(page.getByText(/telegram/i).first()).toBeVisible({ timeout: 15_000 });

        // Check at least one event is visible
        await expect(
            page.getByText(/sensor.*alert|sensor.*alarm|register|anmeld/i).first(),
        ).toBeVisible();
    });

    test("has toggle switches", async ({ page }) => {
        await page.goto("/admin/notifications");

        await expect(page.getByText(/telegram/i).first()).toBeVisible({ timeout: 15_000 });

        // Page should have multiple toggle switches
        const toggles = page.locator("button[role='switch'], input[type='checkbox']");
        const count = await toggles.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });
});
