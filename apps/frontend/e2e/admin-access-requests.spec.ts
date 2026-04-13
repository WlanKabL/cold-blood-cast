import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminAccessRequests } from "./helpers/fixtures";

test.describe("Admin Access Requests", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/access-requests*", mockAdminAccessRequests);
    });

    test("displays access requests", async ({ page }) => {
        await page.goto("/admin/access-requests");

        await expect(
            page.locator("text=newuser1@example.com").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.locator("text=newuser2@example.com").locator("visible=true").first(),
        ).toBeVisible();
    });

    test("shows request reason", async ({ page }) => {
        await page.goto("/admin/access-requests");

        await expect(
            page.locator("text=/love reptiles|track my snake/i").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows pending status", async ({ page }) => {
        await page.goto("/admin/access-requests");

        await expect(
            page.locator("text=/pending|ausstehend/i").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows approve and reject buttons", async ({ page }) => {
        await page.goto("/admin/access-requests");

        await expect(
            page.locator("text=newuser1@example.com").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });

        const approveBtn = page.getByRole("button", { name: /approve|annehmen|genehmigen/i });
        await expect(approveBtn.first()).toBeVisible();

        const rejectBtn = page.getByRole("button", { name: /reject|ablehnen/i });
        await expect(rejectBtn.first()).toBeVisible();
    });

    test("shows status filter tabs", async ({ page }) => {
        await page.goto("/admin/access-requests");

        await expect(
            page.locator("text=newuser1@example.com").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });

        await expect(
            page.locator("text=/pending|ausstehend/i").locator("visible=true").first(),
        ).toBeVisible();
        await expect(
            page.locator("text=/all|alle/i").locator("visible=true").first(),
        ).toBeVisible();
    });
});

test.describe("Admin Access Requests — Empty", () => {
    test("shows empty state", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/access-requests*", []);

        await page.goto("/admin/access-requests");

        await expect(page.getByText(/no.*request|keine.*anfrage|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
