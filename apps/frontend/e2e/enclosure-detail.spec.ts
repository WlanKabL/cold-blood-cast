import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockEnclosureDetail } from "./helpers/fixtures";

test.describe("Enclosure Detail Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures/enc_001", mockEnclosureDetail);
        await mockGet(page, "/api/enclosure-maintenance*", []);
    });

    test("displays enclosure name", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await expect(page.getByText("Main Vivarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows enclosure type", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await expect(page.getByText(/terrarium/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows dimensions", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await expect(page.getByText("120").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows room info", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        await expect(page.getByText("Living Room").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows inhabitants (pets)", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        // Click the Inhabitants tab
        await page
            .getByText(/inhabitants|bewohner/i)
            .first()
            .click();

        await expect(page.getByText("Monty").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Slither").first()).toBeVisible();
    });

    test("shows sensors", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        // Click the Inhabitants tab (sensors are shown there too)
        await page
            .getByText(/inhabitants|bewohner/i)
            .first()
            .click();

        await expect(page.getByText("Hot Side Temp").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows back button", async ({ page }) => {
        await page.goto("/enclosures/enc_001");

        const backLink = page
            .locator("a[href='/enclosures']")
            .or(page.getByRole("button", { name: /back|zurück/i }));
        await expect(backLink.first()).toBeVisible({ timeout: 15_000 });
    });
});
