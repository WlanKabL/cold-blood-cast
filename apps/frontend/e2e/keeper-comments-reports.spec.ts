import { test, expect } from "@playwright/test";
import { mockPublicUserData } from "./helpers/fixtures";

/**
 * Helper: Mock all public user profile endpoints including community.
 * Reuses the same pattern as user-public-profile.spec.ts.
 */
async function mockPublicUserApi(
    page: import("@playwright/test").Page,
    slug: string,
    data: unknown,
    comments: unknown[] = [
        {
            id: "comment_approved_1",
            authorName: "Snake Fan",
            content: "Amazing collection!",
            createdAt: "2026-03-20T10:00:00.000Z",
        },
        {
            id: "comment_approved_2",
            authorName: "Reptile Lover",
            content: "Beautiful morphs!",
            createdAt: "2026-03-22T10:00:00.000Z",
        },
    ],
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

    await page.route(`**/api/public/users/${slug}`, (route) => {
        if (route.request().url().includes("/avatar")) return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });

    await page.route(`**/api/public/users/${slug}/avatar`, (route) =>
        route.fulfill({
            status: 200,
            contentType: "image/png",
            body: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualyQAAAABJRU5ErkJggg==",
                "base64",
            ),
        }),
    );

    await page.route(`**/api/public/community/user/${slug}/like`, (route) => {
        if (route.request().method() === "POST") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { liked: true, count: 6 } }),
            });
        }
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { liked: false, count: 5 } }),
        });
    });

    await page.route(`**/api/public/community/user/${slug}/comments`, (route) => {
        if (route.request().method() === "POST") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { id: "comment_new" } }),
            });
        }
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: comments }),
        });
    });

    await page.route("**/api/public/pets/**/photos/**", (route) =>
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

// ═══════════════════════════════════════════════════════════════
// ─── Comments on Keeper Profile ──────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Keeper Profile — Comments", () => {
    test("shows comments section with existing comments", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Amazing collection!")).toBeVisible();
        await expect(page.getByText("Reptile Lover")).toBeVisible();
        await expect(page.getByText("Beautiful morphs!")).toBeVisible();
    });

    test("shows empty state when no comments", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData, []);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText(/no comment|keine kommentar/i)).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows login prompt when not authenticated", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        // Should show login prompt instead of comment form
        await expect(page.getByText(/log in to|melde dich an/i)).toBeVisible({ timeout: 15_000 });
    });

    test("login link has redirect parameter", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText(/log in to|melde dich an/i)).toBeVisible({ timeout: 15_000 });

        const loginLink = page.locator("a").filter({ hasText: /log in|anmelden/i });
        await expect(loginLink).toBeVisible();
        const href = await loginLink.getAttribute("href");
        expect(href).toContain("/login?redirect=");
        expect(href).toContain("keeper");
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Report Feature on Keeper Profile ────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Keeper Profile — Report System", () => {
    test("shows report profile button", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await expect(reportBtn).toBeVisible({ timeout: 15_000 });
    });

    test("shows flag icon on each comment", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        // Wait for comments to load
        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });

        // Flag buttons (one per comment)
        const flagButtons = page.locator('[aria-label*="report" i], [aria-label*="melden" i]');
        await expect(flagButtons).toHaveCount(2, { timeout: 10_000 });
    });

    test("clicking flag on comment opens report modal", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);
        await page.route("**/api/public/reports", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            }),
        );

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });

        // Click flag on first comment
        const flagButtons = page.locator('[aria-label*="report" i], [aria-label*="melden" i]');
        await flagButtons.first().click();

        // Report modal should appear
        await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible({ timeout: 10_000 });
        // Modal has a reason select
        const select = page.locator(".fixed.inset-0.z-50 select");
        await expect(select).toBeVisible();
    });

    test("clicking report profile button opens report modal", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);
        await page.route("**/api/public/reports", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            }),
        );

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await reportBtn.click({ timeout: 15_000 });

        // Modal appears
        await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible({ timeout: 10_000 });
    });

    test("report modal has reason dropdown, description, and reporter name inputs", async ({
        page,
    }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);
        await page.route("**/api/public/reports", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            }),
        );

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await reportBtn.click({ timeout: 15_000 });

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Reason select
        await expect(modal.locator("select")).toBeVisible();
        // Description textarea
        await expect(modal.locator("textarea")).toBeVisible();
        // Reporter name input
        await expect(modal.locator('input[type="text"]')).toBeVisible();
    });

    test("report modal closes on cancel", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);
        await page.route("**/api/public/reports", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            }),
        );

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await reportBtn.click({ timeout: 15_000 });

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Click cancel button
        const cancelBtn = modal.locator("button").filter({ hasText: /cancel|abbrechen/i });
        await cancelBtn.click();

        await expect(modal).not.toBeVisible({ timeout: 10_000 });
    });

    test("report modal submits successfully", async ({ page }) => {
        let reportPostBody: string | null = null;
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.route("**/api/public/reports", (route) => {
            if (route.request().method() === "POST") {
                reportPostBody = route.request().postData();
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: {} }),
                });
            }
            return route.continue();
        });

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await reportBtn.click({ timeout: 15_000 });

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Fill the form
        await modal.locator("select").selectOption("harassment");
        await modal.locator("textarea").fill("Harassing content on this profile");
        await modal.locator('input[type="text"]').fill("Concerned Visitor");

        // Submit
        const submitBtn = modal.locator("button").filter({ hasText: /submit|absenden|melden/i });
        await submitBtn.click();

        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 10_000 });

        // Verify POST body
        expect(reportPostBody).toBeTruthy();
        const parsed = JSON.parse(reportPostBody!);
        expect(parsed.targetType).toBe("user_profile");
        expect(parsed.targetId).toBe("snake-keeper");
        expect(parsed.reason).toBe("harassment");
        expect(parsed.description).toBe("Harassing content on this profile");
        expect(parsed.reporterName).toBe("Concerned Visitor");
    });

    test("report comment sends correct target type", async ({ page }) => {
        let reportPostBody: string | null = null;
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.route("**/api/public/reports", (route) => {
            if (route.request().method() === "POST") {
                reportPostBody = route.request().postData();
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: {} }),
                });
            }
            return route.continue();
        });

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });

        // Click flag on first comment
        const flagButtons = page.locator('[aria-label*="report" i], [aria-label*="melden" i]');
        await flagButtons.first().click();

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        await modal.locator("select").selectOption("spam");
        const submitBtn = modal.locator("button").filter({ hasText: /submit|absenden|melden/i });
        await submitBtn.click();

        await expect(modal).not.toBeVisible({ timeout: 10_000 });

        expect(reportPostBody).toBeTruthy();
        const parsed = JSON.parse(reportPostBody!);
        expect(parsed.targetType).toBe("comment");
        expect(parsed.targetId).toBe("comment_approved_1");
    });

    test("report modal submit is disabled without reason", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);
        await page.route("**/api/public/reports", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            }),
        );

        await page.goto("/keeper/snake-keeper");

        const reportBtn = page
            .locator("button")
            .filter({ hasText: /report.*profile|profil melden/i });
        await reportBtn.click({ timeout: 15_000 });

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        const submitBtn = modal.locator("button").filter({ hasText: /submit|absenden|melden/i });
        await expect(submitBtn).toBeDisabled();
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Like Feature on Keeper Profile ──────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Keeper Profile — Like Feature", () => {
    test("shows like button with initial count", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("5")).toBeVisible({ timeout: 15_000 });
    });

    test("clicking like button toggles to liked state", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("5")).toBeVisible({ timeout: 15_000 });

        // Click like
        const likeBtn = page.locator("button").filter({ hasText: "5" });
        await likeBtn.click();

        // Count should update to 6
        await expect(page.getByText("6")).toBeVisible({ timeout: 10_000 });
    });
});
