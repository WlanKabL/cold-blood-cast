import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminStats, mockAdminUserGrowth } from "./helpers/fixtures";

test.describe("Admin Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/stats", mockAdminStats);
        await mockGet(page, "/api/admin/stats/growth*", mockAdminUserGrowth);
    });

    test("displays admin dashboard title", async ({ page }) => {
        await page.goto("/admin");

        await expect(page.locator("h1")).toContainText(/admin|dashboard|übersicht/i, {
            timeout: 15_000,
        });
    });

    test("shows total users stat", async ({ page }) => {
        await page.goto("/admin");

        await expect(page.getByText("42").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows active users stat", async ({ page }) => {
        await page.goto("/admin");

        await expect(page.getByText("38").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows pets count", async ({ page }) => {
        await page.goto("/admin");

        await expect(page.getByText("30").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows pending access requests count", async ({ page }) => {
        await page.goto("/admin");

        await expect(page.getByText("3").first()).toBeVisible({ timeout: 15_000 });
    });
});
