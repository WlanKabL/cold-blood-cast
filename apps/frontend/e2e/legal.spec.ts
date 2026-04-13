import { test, expect } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockLegalDocuments, mockLegalDocument } from "./helpers/fixtures";

test.describe("Legal — Index Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockNoAuth(page);
        await mockGet(page, "/api/legal", mockLegalDocuments);
    });

    test("displays legal documents list", async ({ page }) => {
        await page.goto("/legal");

        await expect(page.getByText(/terms of service|nutzungsbedingungen/i).first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText(/privacy policy|datenschutzerklärung/i).first()).toBeVisible();
        await expect(page.getByText(/imprint|impressum/i).first()).toBeVisible();
    });

    test("links to individual documents", async ({ page }) => {
        await page.goto("/legal");

        const link = page.locator("a[href*='/legal/terms']");
        await expect(link).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Legal — Document Page", () => {
    test("displays document content", async ({ page }) => {
        await mockNoAuth(page);
        await mockGet(page, "/api/legal/terms*", mockLegalDocument);

        await page.goto("/legal/terms");

        await expect(page.getByText(/terms of service|nutzungsbedingungen/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows back link", async ({ page }) => {
        await mockNoAuth(page);
        await mockGet(page, "/api/legal/terms*", mockLegalDocument);

        await page.goto("/legal/terms");

        const backLink = page
            .locator("a[href='/legal']")
            .or(page.getByText(/back|zurück|all documents|alle dokumente/i).first());
        await expect(backLink.first()).toBeVisible({ timeout: 15_000 });
    });
});
