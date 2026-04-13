import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminAnnouncements } from "./helpers/fixtures";

test.describe("Admin Announcements", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/announcements/admin/all", mockAdminAnnouncements);
    });

    test("displays announcements list", async ({ page }) => {
        await page.goto("/admin/announcements");

        await expect(page.getByText("System Update").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("New Feature").first()).toBeVisible();
    });

    test("shows active/inactive badges", async ({ page }) => {
        await page.goto("/admin/announcements");

        await expect(page.getByText(/active|aktiv/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows type badges", async ({ page }) => {
        await page.goto("/admin/announcements");

        await expect(page.getByText(/info/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows create button", async ({ page }) => {
        await page.goto("/admin/announcements");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal", async ({ page }) => {
        await page.goto("/admin/announcements");
        await page.waitForLoadState("networkidle");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await createBtn.click();

        await expect(
            page.getByRole("heading", { name: /create announcement|ankündigung erstellen/i }),
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe("Admin Announcements — Empty", () => {
    test("shows empty state", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/announcements/admin/all", []);

        await page.goto("/admin/announcements");

        await expect(
            page.getByText(/no announcement|keine ankündigung|empty/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
