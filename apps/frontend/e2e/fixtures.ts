import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixtures for Cold Blood Cast E2E tests.
 *
 * Extend `base` from Playwright with app-specific helpers.
 */
export const test = base.extend<{
    /** Navigate to /pets and return helper methods */
    petsPage: {
        goto: () => Promise<void>;
        getPetCards: () => ReturnType<typeof base.prototype.page.locator>;
    };
}>({
    petsPage: async ({ page }, use) => {
        await use({
            goto: () => page.goto("/pets").then(() => undefined),
            getPetCards: () => page.locator('[class*="glass-card"]'),
        });
    },
});

export { expect };
