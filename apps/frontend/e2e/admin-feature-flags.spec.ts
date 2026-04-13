import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminFeatureFlags } from "./helpers/fixtures";

test.describe("Admin Feature Flags", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/feature-flags", mockAdminFeatureFlags);
    });

    test("displays feature flags page", async ({ page }) => {
        await page.goto("/admin/feature-flags");

        await expect(page.locator("h1")).toContainText(/feature.flag|feature/i, {
            timeout: 15_000,
        });
    });

    test("shows categories", async ({ page }) => {
        await page.goto("/admin/feature-flags");

        await expect(page.getByText(/core/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/care/i).first()).toBeVisible();
    });

    test("shows individual flags", async ({ page }) => {
        await page.goto("/admin/feature-flags");

        await expect(page.getByText("Dashboard").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/feeding/i).first()).toBeVisible();
    });

    test("shows toggle switches", async ({ page }) => {
        await page.goto("/admin/feature-flags");

        // Toggle/switch elements for enabling/disabling flags
        const toggles = page.locator("button[role='switch'], input[type='checkbox']");
        await expect(toggles.first()).toBeVisible({ timeout: 15_000 });
    });
});
