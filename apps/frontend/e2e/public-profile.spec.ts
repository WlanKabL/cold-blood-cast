import { test, expect } from "@playwright/test";
import { mockPublicPetData, mockPublicPetDataMinimal } from "./helpers/fixtures";

/**
 * Mock the public pet data endpoint (no auth required).
 * Also mocks auth endpoints to return 401 — public pages don't need auth.
 */
async function mockPublicPetApi(
    page: import("@playwright/test").Page,
    slug: string,
    data: unknown,
) {
    const keeperSlug = "testkeeper";
    // Auth endpoints — public pages still trigger refresh attempts
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

    // Legacy /p/:slug resolver -> canonical keeper route
    await page.route(`**/api/public/pets/resolve/${slug}`, (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { userSlug: keeperSlug, petSlug: slug },
            }),
        }),
    );

    // Canonical public pet data
    await page.route(`**/api/public/pets/${keeperSlug}/${slug}`, (route) => {
        if (route.request().url().includes("/photos/")) return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });

    // Photo URLs — serve a 1x1 transparent PNG
    await page.route(`**/api/public/pets/${keeperSlug}/${slug}/photos/**`, (route) =>
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

    await page.route(`**/api/public/pets/resolve/${slug}`, (route) =>
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

// ─── Public Profile Page ────────────────────────────────────

test.describe("Public Profile Page", () => {
    test("renders pet name and bio", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        await expect(page.locator("h1")).toContainText("Monty", { timeout: 15_000 });
        await expect(page.getByText("A friendly corn snake")).toBeVisible();
    });

    test("shows species and morph", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        await expect(page.getByText("Corn Snake", { exact: true })).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.getByText("Amel")).toBeVisible();
    });

    test("shows gender", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        await expect(page.getByText(/male|männlich/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows age calculated from birthDate", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // Born 2022-03-10 → ~4y old (format: "4y Xm old" or "4 years old" or German)
        await expect(page.getByText(/4y\s|4 year|4 jahr/i)).toBeVisible({ timeout: 15_000 });
    });

    test("renders photo gallery", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 2 photos in fixture
        const images = page.locator("section img[loading='lazy']");
        await expect(images).toHaveCount(2, { timeout: 15_000 });
    });

    test("opens lightbox on photo click", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // Click first photo button
        const photoButtons = page.locator("section button");
        await photoButtons.first().click({ timeout: 15_000 });

        // Lightbox should appear with full-size image
        const lightbox = page.locator(".fixed.inset-0");
        await expect(lightbox).toBeVisible();

        // Close button visible
        await expect(lightbox.locator("button")).toBeVisible();
    });

    test("lightbox closes on X button click", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        await page.locator("section button").first().click({ timeout: 15_000 });
        const lightbox = page.locator(".fixed.inset-0");
        await expect(lightbox).toBeVisible();

        // Click close button
        await lightbox.locator("button").click();
        await expect(lightbox).not.toBeVisible();
    });

    test("shows weight chart with latest weight", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // Latest weight = 450g
        await expect(page.getByText("450g")).toBeVisible({ timeout: 15_000 });
    });

    test("shows weight change indicator", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 450 - 430 = +20g
        await expect(page.getByText("+20.0g")).toBeVisible({ timeout: 15_000 });
    });

    test("shows weight sparkline bars", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 3 weight records → 3 sparkline bars
        const bars = page.locator(".flex.h-20 > div");
        await expect(bars).toHaveCount(3, { timeout: 15_000 });
    });

    test("shows recent feedings list", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 3 feedings in fixture
        await expect(page.getByText("Mouse").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Rat")).toBeVisible();
    });

    test("shows refused feeding indicator", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 3rd feeding has accepted: false — x-circle icon should appear
        const refusedIcon = page.locator("[class*='text-red']");
        await expect(refusedIcon.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows shedding history with completion status", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        // 2 shedding records
        // First one: complete, quality "complete"
        await expect(page.getByText("complete").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows Powered by KeeperLog footer", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");

        await expect(page.getByText(/powered by/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("KeeperLog")).toBeVisible();
    });

    test("has SEO title with pet name", async ({ page }) => {
        await mockPublicPetApi(page, "monty-the-snake", mockPublicPetData);

        await page.goto("/p/monty-the-snake");
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveTitle(/Monty/);
    });

    // ─── Not Found ──────────────────────────────────────────

    test("shows not-found state for invalid slug", async ({ page }) => {
        await mockPublicPetNotFound(page, "does-not-exist");

        await page.goto("/p/does-not-exist");

        await expect(page.getByText(/not found|nicht gefunden/i)).toBeVisible({ timeout: 15_000 });
    });

    test("not-found page has back-to-home link", async ({ page }) => {
        await mockPublicPetNotFound(page, "does-not-exist");

        await page.goto("/p/does-not-exist");

        const homeLink = page.locator("a[href='/']");
        await expect(homeLink).toBeVisible({ timeout: 15_000 });
    });

    // ─── Minimal Profile (privacy toggles) ─────────────────

    test("hides sections when data is empty/private", async ({ page }) => {
        await mockPublicPetApi(page, "slither-minimal", mockPublicPetDataMinimal);

        await page.goto("/p/slither-minimal");

        await expect(page.locator("h1")).toContainText("Slither", { timeout: 15_000 });

        // No photo gallery section
        await expect(page.getByText(/photos|fotos/i)).not.toBeVisible();

        // No weight section
        await expect(page.getByText(/weight|gewicht/i)).not.toBeVisible();

        // No feeding section
        await expect(page.getByText(/feeding|fütterung/i)).not.toBeVisible();

        // No shedding section
        await expect(page.getByText(/shedding|häutung/i)).not.toBeVisible();
    });

    test("no profile photo shows paw-print placeholder", async ({ page }) => {
        await mockPublicPetApi(page, "slither-minimal", mockPublicPetDataMinimal);

        await page.goto("/p/slither-minimal");

        // No profile image, should see the placeholder div
        await expect(page.locator("h1")).toContainText("Slither", { timeout: 15_000 });
        // Profile image should NOT exist
        const profileImg = page.locator("img[alt='Slither']");
        await expect(profileImg).not.toBeVisible();
    });
});
