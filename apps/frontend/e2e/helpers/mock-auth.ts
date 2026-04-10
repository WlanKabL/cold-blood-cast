/**
 * E2E Auth Mocking — Intercept auth + global data API calls.
 *
 * Call `mockAuth(page)` before navigating to any authenticated page.
 * This sets up mocks for /api/auth/me, /api/auth/refresh, and all
 * globally-fetched data endpoints (announcements, platform status).
 */

import type { Page } from "@playwright/test";
import { type MockMeResponse, defaultUser, mockAnnouncements } from "./fixtures";

/**
 * Mock all auth + global data endpoints for an authenticated user.
 *
 * Must be called BEFORE `page.goto(...)` so routes are intercepted from the start.
 */
export async function mockAuth(page: Page, user: MockMeResponse = defaultUser) {
    // POST /api/auth/refresh → returns fake access token
    await page.route("**/api/auth/refresh", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { tokens: { accessToken: "mock-access-token-e2e" } },
            }),
        }),
    );

    // GET /api/auth/me → returns user fixture
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: user }),
        }),
    );

    // ── Global data endpoints (Default layout) ──

    // GET /api/auth/platform-status
    await page.route("**/api/auth/platform-status", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { maintenance: false } }),
        }),
    );

    // GET /api/announcements
    await page.route("**/api/announcements", (route) => {
        if (route.request().method() === "GET") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: mockAnnouncements }),
            });
        }
        return route.continue();
    });
}

/**
 * Mock auth to simulate an unauthenticated user (no session).
 * The refresh call fails → auth store stays empty → middleware redirects to /login.
 */
export async function mockNoAuth(page: Page) {
    await page.route("**/api/auth/refresh", (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({
                success: false,
                error: { code: "E_UNAUTHORIZED", message: "Not authenticated" },
            }),
        }),
    );

    await page.route("**/api/auth/me", (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({
                success: false,
                error: { code: "E_UNAUTHORIZED", message: "Not authenticated" },
            }),
        }),
    );

    await page.route("**/api/auth/platform-status", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { maintenance: false } }),
        }),
    );
}
