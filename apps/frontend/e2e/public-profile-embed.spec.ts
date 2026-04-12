import { test, expect } from "@playwright/test";
import { mockPublicPetData, mockPublicPetDataMinimal } from "./helpers/fixtures";

/**
 * Mock the public pet data endpoint for embed pages.
 */
async function mockPublicPetApi(
    page: import("@playwright/test").Page,
    slug: string,
    data: unknown,
) {
    await page.route("**/api/auth/refresh", (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({
                success: false,
                error: { code: "E_UNAUTHORIZED", message: "No session" },
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

    await page.route(`**/api/public/pets/${slug}`, (route) => {
        if (route.request().url().includes("/photos/")) return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });

    await page.route(`**/api/public/pets/${slug}/photos/**`, (route) =>
        route.fulfill({
            status: 200,
            contentType: "image/png",
            body: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualyQAAAABJRU5ErkJggg==",
                "base64",
            ),
        }),
    );
}

async function mockPublicPetNotFound(page: import("@playwright/test").Page, slug: string) {
    await page.route("**/api/auth/refresh", (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({
                success: false,
                error: { code: "E_UNAUTHORIZED", message: "No session" },
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

    await page.route(`**/api/public/pets/${slug}`, (route) =>
        route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
                success: false,
                error: { code: "E_PUBLIC_PROFILE_NOT_FOUND", message: "Profile not found" },
            }),
        }),
    );
}

// ─── Embed Page ─────────────────────────────────────────────

test.describe("Public Profile Embed", () => {
    test("renders compact pet card with name", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.locator("h1")).toContainText("Monty", { timeout: 15_000 });
    });

    test("shows species and morph", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.getByText(/Corn Snake/)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/Amel/)).toBeVisible();
    });

    test("shows age", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.getByText(/4y\s|4 year|4 jahr/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows bio text", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.getByText("A friendly corn snake")).toBeVisible({ timeout: 15_000 });
    });

    test("renders scrollable photo strip", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        // 2 photos (fixture has 2, max 6 displayed)
        const photos = page.locator("img[loading='lazy']");
        await expect(photos).toHaveCount(2, { timeout: 15_000 });
    });

    test("shows weight stat when records exist", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        // Latest weight = 450g
        await expect(page.getByText("450g")).toBeVisible({ timeout: 15_000 });
    });

    test("shows feeding count", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        // 3 feedings in fixture — the stat grid shows the count
        const feedingStat = page.locator(".glass-card").filter({ hasText: /feeding|fütterung/i });
        await expect(feedingStat.getByText("3")).toBeVisible({ timeout: 15_000 });
    });

    test("shows shedding count", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        // 2 sheddings in fixture
        const sheddingStat = page.locator(".glass-card").filter({ hasText: /shedding|häutung/i });
        await expect(sheddingStat.getByText("2")).toBeVisible({ timeout: 15_000 });
    });

    test("has View Full Profile link", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.getByText(/view full profile|vollständiges profil/i)).toBeVisible({
            timeout: 15_000,
        });
    });

    test("full profile link points to /p/slug", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        const link = page
            .locator("a")
            .filter({ hasText: /view full profile|vollständiges profil/i });
        await expect(link).toBeVisible({ timeout: 15_000 });
        await expect(link).toHaveAttribute("href", /\/p\/monty-the-snake/);
    });

    test("shows Powered by KeeperLog branding", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake/embed");

        await expect(page.getByText(/powered by/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("KeeperLog")).toBeVisible();
    });

    // ─── Not Found ──────────────────────────────────────────

    test("shows not-found state for invalid slug", async ({ page }) => {
        await mockPublicPetNotFound(page, "nope");

        await page.goto("/p/nope/embed");

        await expect(page.getByText(/not found|nicht gefunden/i)).toBeVisible({
            timeout: 15_000,
        });
    });

    // ─── Minimal Profile ────────────────────────────────────

    test("handles profile with no photos or stats gracefully", async ({ page }) => {
        await mockPublicPetApi(page, "slither-minimal", mockPublicPetDataMinimal);

        await page.goto("/p/slither-minimal/embed");

        await expect(page.locator("h1")).toContainText("Slither", { timeout: 15_000 });

        // No photos, no stats — should still render without errors
        const photos = page.locator("img[loading='lazy']");
        await expect(photos).toHaveCount(0);
    });

    test("hides bio when not present", async ({ page }) => {
        await mockPublicPetApi(page, "slither-minimal", mockPublicPetDataMinimal);

        await page.goto("/p/slither-minimal/embed");

        await expect(page.locator("h1")).toContainText("Slither", { timeout: 15_000 });
        // bio is null — the bio paragraph should not be rendered
        await expect(page.getByText("A friendly")).not.toBeVisible();
    });
});
