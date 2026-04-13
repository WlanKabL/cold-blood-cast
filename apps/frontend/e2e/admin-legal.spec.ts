import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser, mockAdminLegalDocuments } from "./helpers/fixtures";

test.describe("Admin Legal Documents", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/legal", mockAdminLegalDocuments);
    });

    test("displays legal documents list", async ({ page }) => {
        await page.goto("/admin/legal");

        await expect(page.getByText("Terms of Service").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Privacy Policy").first()).toBeVisible();
    });

    test("shows published badge", async ({ page }) => {
        await page.goto("/admin/legal");

        await expect(page.getByText("Terms of Service").first()).toBeVisible({ timeout: 15_000 });

        // Terms and Privacy are published — badge text is "Published"
        await expect(page.getByText("Published").first()).toBeVisible();
    });

    test("shows draft badge for unpublished", async ({ page }) => {
        await page.goto("/admin/legal");

        await expect(page.getByText("Imprint").first()).toBeVisible({ timeout: 15_000 });

        await expect(page.getByText(/draft|entwurf/i).first()).toBeVisible();
    });

    test("shows edit buttons", async ({ page }) => {
        await page.goto("/admin/legal");

        await expect(page.getByText("Terms of Service").first()).toBeVisible({ timeout: 15_000 });

        const editBtns = page.getByRole("button", { name: /edit|bearbeiten/i });
        const count = await editBtns.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test("shows German title for bilingual docs", async ({ page }) => {
        await page.goto("/admin/legal");

        await expect(
            page
                .getByText("Nutzungsbedingungen")
                .or(page.getByText("Datenschutzerklärung"))
                .first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
