import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    adminUser,
    mockAdminUsers,
    mockAdminUserDetail,
    mockAdminRoles,
    mockAdminFeatureFlags,
} from "./helpers/fixtures";

test.describe("Admin Users — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/users?*", mockAdminUsers);
        await mockGet(page, "/api/admin/roles", mockAdminRoles);
        await mockGet(page, "/api/admin/pending-approvals", []);
    });

    test("displays users list", async ({ page }) => {
        await page.goto("/admin/users");

        await expect(page.locator("text=Test Keeper").locator("visible=true").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows user emails", async ({ page }) => {
        await page.goto("/admin/users");

        await expect(
            page.locator("text=test@coldbloodcast.local").locator("visible=true").first(),
        ).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows search input", async ({ page }) => {
        await page.goto("/admin/users");

        const search = page
            .locator(
                "input[type='text'], input[placeholder*='search' i], input[placeholder*='such' i]",
            )
            .first();
        await expect(search).toBeVisible({ timeout: 15_000 });
    });

    test("shows role filter", async ({ page }) => {
        await page.goto("/admin/users");

        const select = page.locator("select").first();
        await expect(select).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Admin Users — Detail Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/users/usr_test_001", mockAdminUserDetail);
        await mockGet(page, "/api/admin/roles", mockAdminRoles);
        await mockGet(page, "/api/admin/feature-flags", mockAdminFeatureFlags);
    });

    test("displays user details", async ({ page }) => {
        await page.goto("/admin/users/usr_test_001");

        await expect(page.getByText("testkeeper").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("test@coldbloodcast.local").first()).toBeVisible();
    });

    test("shows user roles", async ({ page }) => {
        await page.goto("/admin/users/usr_test_001");

        await expect(page.getByText("Free").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows ban button", async ({ page }) => {
        await page.goto("/admin/users/usr_test_001");

        const banBtn = page.getByRole("button", { name: /ban|sperren/i });
        await expect(banBtn).toBeVisible({ timeout: 15_000 });
    });

    test("shows back navigation", async ({ page }) => {
        await page.goto("/admin/users/usr_test_001");

        const backLink = page
            .locator("a[href*='/admin/users']")
            .or(page.getByRole("button", { name: /back|zurück/i }));
        await expect(backLink.first()).toBeVisible({ timeout: 15_000 });
    });
});
