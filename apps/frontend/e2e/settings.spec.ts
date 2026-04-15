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

test.describe("Settings — Security Tab", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
    });

    test("shows username change section", async ({ page }) => {
        await page.goto("/settings");

        // Click the security tab
        await page
            .getByText(/security|sicherheit/i)
            .first()
            .click();

        await expect(page.getByText(/change username|benutzername ändern/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows username input and password field", async ({ page }) => {
        await page.goto("/settings");

        await page
            .getByText(/security|sicherheit/i)
            .first()
            .click();

        await expect(page.getByPlaceholder("testkeeper").first()).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByPlaceholder(/current password|aktuelles passwort/i).first(),
        ).toBeVisible();
    });

    test("shows email change section", async ({ page }) => {
        await page.goto("/settings");

        await page
            .getByText(/security|sicherheit/i)
            .first()
            .click();

        await expect(page.getByText(/change email|e-mail.*ändern/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows current email in email change section", async ({ page }) => {
        await page.goto("/settings");

        await page
            .getByText(/security|sicherheit/i)
            .first()
            .click();

        await expect(page.getByText("test@coldbloodcast.local").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows password reset section", async ({ page }) => {
        await page.goto("/settings");

        await page
            .getByText(/security|sicherheit/i)
            .first()
            .click();

        await expect(page.getByText(/password|passwort/i).first()).toBeVisible({ timeout: 15_000 });
    });
});
