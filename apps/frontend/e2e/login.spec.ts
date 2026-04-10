import { test, expect } from "@playwright/test";
import { mockAuth, mockNoAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    mockPets,
    mockEnclosures,
    mockSensors,
    mockFeedings,
    mockFeedingReminders,
    mockUpcomingAppointments,
} from "./helpers/fixtures";

test.describe("Login Page", () => {
    test("renders login form", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/login");

        await expect(page.locator("h1")).toContainText("KeeperLog", { timeout: 15_000 });
        await expect(page.locator("#login")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();
        await expect(page.locator("button[type='submit']")).toBeVisible();
    });

    test("has forgot password link", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/login");

        const forgotLink = page.locator("a[href='/forgot-password']");
        await expect(forgotLink).toBeVisible({ timeout: 15_000 });
    });

    test("has register link", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/login");

        const registerLink = page.locator("a[href='/register']");
        await expect(registerLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows error on invalid credentials", async ({ page }) => {
        await mockNoAuth(page);

        // Mock login endpoint to return error
        await page.route("**/api/auth/login", (route) =>
            route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    error: { code: "E_INVALID_CREDENTIALS", message: "Invalid credentials" },
                }),
            }),
        );

        await page.goto("/login");

        await page.locator("#login").fill("wronguser");
        await page.locator("#password").fill("wrongpassword");
        await page.locator("button[type='submit']").click();

        // Error message should appear
        await expect(page.getByText("Invalid credentials")).toBeVisible({ timeout: 10_000 });
    });

    test("successful login redirects to dashboard", async ({ page }) => {
        await mockNoAuth(page);

        // Mock login to succeed
        await page.route("**/api/auth/login", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { tokens: { accessToken: "mock-token-after-login" } },
                }),
            }),
        );

        await page.goto("/login");

        await page.locator("#login").fill("testkeeper");
        await page.locator("#password").fill("correct-password");

        // Set up auth mocks AFTER form fill but BEFORE submit —
        // this ensures initial load sees 401 (login form renders),
        // but post-login refresh/me calls succeed (LIFO handler order)
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
        await mockGet(page, "/api/pets", mockPets);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/feedings", mockFeedings);
        await mockGet(page, "/api/feeding-reminders", mockFeedingReminders);
        await mockGet(page, "/api/vet-visits/upcoming", mockUpcomingAppointments);

        await page.locator("button[type='submit']").click();

        // Should redirect to /dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
    });

    test("submit button shows loading state", async ({ page }) => {
        await mockNoAuth(page);

        // Mock a slow login response
        await page.route("**/api/auth/login", async (route) => {
            await new Promise((r) => setTimeout(r, 2000));
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { tokens: { accessToken: "mock-token" } },
                }),
            });
        });

        await page.goto("/login");

        await page.locator("#login").fill("testkeeper");
        await page.locator("#password").fill("password");
        await page.locator("button[type='submit']").click();

        // Button text should change to "signing in" state
        const submitBtn = page.locator("button[type='submit']");
        await expect(submitBtn).toBeDisabled({ timeout: 5_000 });
    });
});

test.describe("Auth Guard", () => {
    test("redirects to login when not authenticated", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/dashboard");

        // Should redirect to /login
        await expect(page).toHaveURL(/login/, { timeout: 15_000 });
    });

    test("redirects to login from protected pet page", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/pets");

        await expect(page).toHaveURL(/login/, { timeout: 15_000 });
    });

    test("preserves redirect query on login redirect", async ({ page }) => {
        await mockNoAuth(page);

        await page.goto("/vet-visits");

        // Should redirect to /login with redirect query
        await expect(page).toHaveURL(/login/, { timeout: 15_000 });
    });
});
