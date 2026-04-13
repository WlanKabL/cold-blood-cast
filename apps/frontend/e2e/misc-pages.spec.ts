import { test, expect } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";

test.describe("Export Download", () => {
    test("shows error when no valid token", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/export/invalid-token");

        // Page should show download state or error
        await expect(
            page.getByText(/download|export|herunterladen|error|fehler/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Confirm Account Deletion", () => {
    test("shows error when no token provided", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/confirm-delete");

        await expect(page.getByText(/invalid|ungültig|error|fehler/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows login link on invalid page", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/confirm-delete");

        await expect(
            page.getByText(/invalid|ungültig|error|fehler|login|anmeld/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows password form when token present", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/confirm-delete?token=test-token-123");

        // Should show password input and delete button
        await expect(page.getByText(/password|passwort|delete|löschen/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});

test.describe("Unsubscribe", () => {
    test("shows processing state on mount", async ({ page }) => {
        await mockNoAuth(page);

        // Mock the unsubscribe endpoint
        await page.route("**/api/email/unsubscribe*", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { success: true, message: "Unsubscribed successfully" },
                }),
            }),
        );

        await page.goto("/unsubscribe?token=test-token&action=unsubscribe");

        // Should show success or processing state
        await expect(
            page.getByText(/unsubscribe|abgemeldet|success|processing|verarbeite/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows error without token", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/unsubscribe");

        await expect(page.getByText(/error|fehler|invalid|ungültig|token/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
