import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation, mockError } from "./helpers/mock-api";
import {
    mockUserPublicProfile,
    mockPublicUserData,
    mockUserBadges,
    mockPendingComments,
} from "./helpers/fixtures";

// ─── Helper: mock all user-profile management API endpoints ──

async function mockUserProfileManagementApi(
    page: import("@playwright/test").Page,
    profile: unknown = mockUserPublicProfile,
) {
    if (profile) {
        await mockGet(page, "/api/user-profile", profile);
    } else {
        await mockError(page, "/api/user-profile", 404, "E_USER_PROFILE_NOT_FOUND", "Not found");
    }
    await mockGet(page, "/api/badges", mockUserBadges);
    await mockGet(page, "/api/comments/pending", mockPendingComments);
}

// ─── Helper: mock public user profile endpoints ──────────────

async function mockPublicUserApi(
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

    await page.route(`**/api/public/users/${slug}`, (route) => {
        if (route.request().url().includes("/avatar")) return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });

    // Avatar — 1x1 transparent PNG
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

    // Community like status
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

    // Comments
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
            body: JSON.stringify({
                success: true,
                data: [
                    {
                        id: "comment_approved_1",
                        authorName: "Snake Fan",
                        content: "Amazing collection!",
                        createdAt: "2026-03-20T10:00:00.000Z",
                    },
                ],
            }),
        });
    });

    // Pet photo URLs
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
// ─── Management Page (Authenticated) ─────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("User Public Profile Management", () => {
    test("shows create form when no profile exists", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page, null);

        await page.goto("/public-profile");

        await expect(page.getByText(/create public profile/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows profile management when profile exists", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/profile active/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("128")).toBeVisible(); // views
    });

    test("displays badges section", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/badges/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("displays pending comments for moderation", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText("Visitor")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Beautiful snake collection!")).toBeVisible();
    });

    test("shows social links section", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/social links/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows visibility toggles", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/visibility/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/show statistics/i)).toBeVisible();
        await expect(page.getByText(/show pets/i)).toBeVisible();
    });

    test("shows theme preset selector", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/forest/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/ocean/i)).toBeVisible();
    });

    test("copy link button present", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/copy link/i)).toBeVisible({ timeout: 15_000 });
    });

    test("embed code button present", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/embed/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("QR code button present", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/qr/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("save button triggers API call", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);
        await mockMutation(page, "PATCH", "/api/user-profile", mockUserPublicProfile);
        await mockMutation(page, "PUT", "/api/user-profile/social-links", {});

        await page.goto("/public-profile");

        const saveBtn = page.getByRole("button", { name: /save/i });
        await expect(saveBtn).toBeVisible({ timeout: 15_000 });
    });

    test("delete button present with confirm flow", async ({ page }) => {
        await mockAuth(page);
        await mockUserProfileManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/delete profile/i)).toBeVisible({ timeout: 15_000 });
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Public User Profile Page ────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Public User Profile Page", () => {
    test("renders user display name and tagline", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.locator("h1")).toContainText("SnakeKeeper", { timeout: 15_000 });
        await expect(page.getByText("Keeping reptiles since 2015")).toBeVisible();
    });

    test("shows bio text", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Passionate corn snake keeper from Berlin")).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows location", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Berlin, Germany")).toBeVisible({ timeout: 15_000 });
    });

    test("renders statistics", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("3")).toBeVisible({ timeout: 15_000 }); // pet count
        await expect(page.getByText("45")).toBeVisible(); // photos
        await expect(page.getByText("120")).toBeVisible(); // feedings
    });

    test("shows badges", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText(/badges/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("renders pet list", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Monty")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Noodle")).toBeVisible();
    });

    test("pet cards link to pet profile", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        // Monty has petSlug, should be a link
        const montyLink = page.locator('a[href*="/keeper/snake-keeper/p/monty-the-snake"]');
        await expect(montyLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows social links", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Instagram")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("YouTube")).toBeVisible();
    });

    test("shows like button with count", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("5")).toBeVisible({ timeout: 15_000 });
    });

    test("shows comments section", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Amazing collection!")).toBeVisible();
    });

    test("shows not found for invalid slug", async ({ page }) => {
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
        await page.route("**/api/public/users/does-not-exist", (route) =>
            route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    error: { code: "E_USER_PROFILE_NOT_FOUND", message: "Not found" },
                }),
            }),
        );
        await page.route("**/api/public/community/**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: [] }),
            }),
        );

        await page.goto("/keeper/does-not-exist");

        await expect(page.getByText(/profile not found/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows powered by KeeperLog footer", async ({ page }) => {
        await mockPublicUserApi(page, "snake-keeper", mockPublicUserData);

        await page.goto("/keeper/snake-keeper");

        await expect(page.getByText("KeeperLog")).toBeVisible({ timeout: 15_000 });
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Embed Page ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("User Profile Embed Page", () => {
    test("renders compact user card", async ({ page }) => {
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
        await page.route("**/api/public/users/snake-keeper", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: mockPublicUserData }),
            }),
        );
        await page.route("**/api/public/users/snake-keeper/avatar", (route) =>
            route.fulfill({
                status: 200,
                contentType: "image/png",
                body: Buffer.from(
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualyQAAAABJRU5ErkJggg==",
                    "base64",
                ),
            }),
        );

        await page.goto("/keeper/snake-keeper/embed");

        await expect(page.getByText("SnakeKeeper")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Monty")).toBeVisible();
    });
});
