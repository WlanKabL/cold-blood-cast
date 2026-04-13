import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";

test.describe("Settings Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
    });

    test("loads settings page with tabs", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.locator("h1")).toContainText(/settings|einstellungen/i, {
            timeout: 15_000,
        });
    });

    test("shows appearance section with theme toggle", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.getByText(/appearance|darstellung|theme/i).first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText(/dark mode|light mode|hell|dunkel/i).first()).toBeVisible();
    });

    test("shows language setting", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.getByText(/language|sprache/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows security tab", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.getByText(/security|sicherheit/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows privacy tab", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.getByText(/privacy|datenschutz/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
