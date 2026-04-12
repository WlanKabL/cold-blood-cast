/**
 * E2E API Mocking Helpers — Generic route mocking utilities.
 *
 * Use these to mock page-specific endpoints in individual test files.
 * Auth + global data mocks are handled by mock-auth.ts.
 */

import type { Page } from "@playwright/test";

/**
 * Mock a GET endpoint returning a successful JSON response.
 * Wraps in `{ success: true, data: ... }` to match the ApiResponse<T> shape.
 */
export async function mockGet(page: Page, urlPattern: string, data: unknown, status = 200) {
    await page.route(`**${urlPattern}`, (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        return route.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });
}

/**
 * Mock a mutation endpoint (POST/PUT/PATCH/DELETE) returning a success response.
 */
export async function mockMutation(
    page: Page,
    method: string,
    urlPattern: string,
    responseData: unknown = {},
    status = 200,
) {
    await page.route(`**${urlPattern}`, (route) => {
        if (route.request().method() === method.toUpperCase()) {
            return route.fulfill({
                status,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: responseData }),
            });
        }
        return route.fallback();
    });
}

/**
 * Mock an endpoint to return an API error.
 */
export async function mockError(
    page: Page,
    urlPattern: string,
    status: number,
    code: string,
    message: string,
) {
    await page.route(`**${urlPattern}`, (route) =>
        route.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify({ success: false, error: { code, message } }),
        }),
    );
}

/**
 * Mock a DELETE endpoint returning success.
 */
export async function mockDelete(page: Page, urlPattern: string) {
    await mockMutation(page, "DELETE", urlPattern);
}
