import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminAuditLog } from "./helpers/fixtures";

test.describe("Admin Audit Log", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/audit-log*", mockAdminAuditLog);
    });

    test("displays audit log entries", async ({ page }) => {
        await page.goto("/admin/audit-log");

        await expect(page.locator("text=user.login").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator("text=pet.create").locator("visible=true").first()).toBeVisible();
    });

    test("shows action and entity type", async ({ page }) => {
        await page.goto("/admin/audit-log");

        await expect(page.locator("text=user.login").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows IP address", async ({ page }) => {
        await page.goto("/admin/audit-log");

        await expect(
            page.locator("text=192.168.1.100").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows filter inputs", async ({ page }) => {
        await page.goto("/admin/audit-log");

        await expect(page.locator("text=user.login").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });

        const inputs = page.locator("input:visible");
        const count = await inputs.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test("shows pagination info", async ({ page }) => {
        await page.goto("/admin/audit-log");

        await expect(page.locator("text=user.login").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });

        // "2 entries"
        await expect(page.getByText(/2 entries/i).first()).toBeVisible();
    });
});
