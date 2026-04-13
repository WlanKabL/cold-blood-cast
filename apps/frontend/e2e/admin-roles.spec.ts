import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    adminUser,
    mockAdminRoles,
    mockAdminRoleDetail,
    mockAdminFeatureFlags,
} from "./helpers/fixtures";

test.describe("Admin Roles — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/roles", mockAdminRoles);
    });

    test("displays roles list", async ({ page }) => {
        await page.goto("/admin/roles");

        await expect(page.getByText("Free").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Premium").first()).toBeVisible();
        await expect(page.getByText("Admin").first()).toBeVisible();
    });

    test("shows system badge on system roles", async ({ page }) => {
        await page.goto("/admin/roles");

        await expect(page.getByText(/system/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows create button", async ({ page }) => {
        await page.goto("/admin/roles");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Admin Roles — Detail Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/roles/role_premium", mockAdminRoleDetail);
        await mockGet(page, "/api/admin/feature-flags", mockAdminFeatureFlags);
    });

    test("displays role details", async ({ page }) => {
        await page.goto("/admin/roles/role_premium");

        await expect(page.getByText("Premium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows feature flags for role", async ({ page }) => {
        await page.goto("/admin/roles/role_premium");

        await expect(page.getByText(/api_access/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows back navigation", async ({ page }) => {
        await page.goto("/admin/roles/role_premium");

        const backLink = page
            .locator("a[href*='/admin/roles']")
            .or(page.getByRole("button", { name: /back|zurück/i }));
        await expect(backLink.first()).toBeVisible({ timeout: 15_000 });
    });
});
