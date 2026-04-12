import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for Cold Blood Cast Frontend.
 *
 * All tests use API mocking (route.fulfill) — no live backend required.
 * The dev server must be running on :3000 (or started via webServer below).
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [["github"], ["blob"]] : "html",
    timeout: 30_000,

    /* Give the Nuxt SPA time to hydrate on the dev server */
    expect: { timeout: 15_000 },

    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    /* Start frontend dev server before tests automatically */
    webServer: {
        command: "pnpm dev:frontend",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: "../..",
    },
});
