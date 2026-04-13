import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminInviteCodes } from "./helpers/fixtures";

test.describe("Admin Invite Codes", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/invites", mockAdminInviteCodes);
        await mockGet(page, "/api/admin/settings", []);
    });

    test("displays invite codes list", async ({ page }) => {
        await page.goto("/admin/invites");

        await expect(page.getByText("WELCOME-2025").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("VIP-ACCESS").first()).toBeVisible();
    });

    test("shows label", async ({ page }) => {
        await page.goto("/admin/invites");

        await expect(page.getByText("Beta Testers").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows usage count", async ({ page }) => {
        await page.goto("/admin/invites");

        // Format: "3/10 uses"
        await expect(page.getByText("3/10 uses").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows create button", async ({ page }) => {
        await page.goto("/admin/invites");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Admin Invite Codes — Empty", () => {
    test("shows empty state", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/invites", []);
        await mockGet(page, "/api/admin/settings", []);

        await page.goto("/admin/invites");

        await expect(page.getByText(/no invite|kein einladungscode|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
