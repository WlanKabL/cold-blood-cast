import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminSettings, mockAdminRolesSimple } from "./helpers/fixtures";

test.describe("Admin Settings", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/settings", mockAdminSettings);
        await mockGet(page, "/api/admin/roles", mockAdminRolesSimple);
    });

    test("displays settings page", async ({ page }) => {
        await page.goto("/admin/settings");

        await expect(page.getByText(/setting|einstellung/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows registration mode setting", async ({ page }) => {
        await page.goto("/admin/settings");

        await expect(page.getByText(/registration|registrierung/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows default role setting", async ({ page }) => {
        await page.goto("/admin/settings");

        await expect(page.getByText(/default.*role|standard.*rolle/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows toggle controls", async ({ page }) => {
        await page.goto("/admin/settings");

        await expect(page.getByText(/registration|registrierung/i).first()).toBeVisible({
            timeout: 15_000,
        });

        const toggles = page.locator("button[role='switch'], input[type='checkbox'], select");
        const count = await toggles.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});
