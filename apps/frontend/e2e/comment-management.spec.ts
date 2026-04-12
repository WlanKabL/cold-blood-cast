import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockUserPublicProfile, mockUserBadges, mockApprovedComments } from "./helpers/fixtures";

// ─── Helper: Mock comment management APIs ────────────────────

async function mockCommentManagementApi(
    page: import("@playwright/test").Page,
    profile = mockUserPublicProfile,
    approved = mockApprovedComments,
) {
    await mockGet(page, "/api/user-profile", profile);
    await mockGet(page, "/api/badges", mockUserBadges);
    await mockGet(page, "/api/comments/approved", approved);
    await mockGet(page, "/api/comments/pending", []);
}

// ═══════════════════════════════════════════════════════════════
// ─── Approved Comments Management ────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Comment Management — Approved Comments", () => {
    test("shows comments section with count", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText(/comment|kommentar/i).first()).toBeVisible({
            timeout: 15_000,
        });
        // Count badge showing 2
        const countBadge = page.locator(".bg-green-500\\/10");
        await expect(countBadge.first()).toBeVisible();
    });

    test("displays approved comment details", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Amazing collection!")).toBeVisible();
        await expect(page.getByText("Reptile Lover")).toBeVisible();
        await expect(page.getByText("Great care tips!")).toBeVisible();
    });

    test("shows delete button on each comment", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.goto("/public-profile");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });

        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        expect(await deleteBtns.count()).toBeGreaterThanOrEqual(2);
    });

    test("deleting comment triggers confirm and sends DELETE", async ({ page }) => {
        let deleteCalled = false;
        let deleteUrl = "";

        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.route("**/api/comments/*", (route) => {
            if (route.request().method() === "DELETE") {
                deleteCalled = true;
                deleteUrl = route.request().url();
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: {} }),
                });
            }
            // Let GET requests be handled by earlier mocks
            return route.fallback();
        });

        // Auto-accept confirm dialogs
        page.on("dialog", (dialog) => dialog.accept());

        await page.goto("/public-profile");

        await expect(page.getByText("Snake Fan")).toBeVisible({ timeout: 15_000 });

        // Click delete on first comment
        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        await deleteBtns.first().click();

        await expect.poll(() => deleteCalled, { timeout: 10_000 }).toBe(true);
        expect(deleteUrl).toContain("/api/comments/");
    });

    test("hides comments section when no approved comments", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page, mockUserPublicProfile, []);

        await page.goto("/public-profile");

        // Profile should load
        await expect(page.getByText(/profile.*published|profil.*veröffentlicht/i)).toBeVisible({
            timeout: 15_000,
        });

        // No delete buttons visible (no comments section)
        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        await expect(deleteBtns).toHaveCount(0);
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Notify on Comment Toggle ────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Comment Management — Notification Toggle", () => {
    test("shows notify on comment toggle in visibility section", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.goto("/public-profile");

        // Expand visibility section
        const visibilityBtn = page
            .locator("button")
            .filter({ hasText: /visibility|sichtbarkeit/i });
        await visibilityBtn.click({ timeout: 15_000 });

        await expect(
            page.getByText(/^email on new comments$|^e-mail bei neuen kommentaren$/i),
        ).toBeVisible({
            timeout: 15_000,
        });
    });

    test("notify on comment toggle is clickable", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page);

        await page.goto("/public-profile");

        // Expand visibility section
        const visibilityBtn = page
            .locator("button")
            .filter({ hasText: /visibility|sichtbarkeit/i });
        await visibilityBtn.click({ timeout: 15_000 });

        // Find the toggle button for notifyOnComment
        const notifyRow = page
            .locator("div.flex.items-center")
            .filter({ hasText: /email on new comments|e-mail bei neuen kommentaren/i });
        const toggleBtn = notifyRow.locator("button.rounded-full");
        // Clicking should work without error
        await toggleBtn.click({ force: true });
    });
});

// ═══════════════════════════════════════════════════════════════
// ─── Multiple Comments ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Comment Management — Multiple Comments", () => {
    const multipleComments = [
        {
            id: "comment_mc_001",
            authorName: "First Visitor",
            content: "First comment",
            createdAt: "2026-04-01T10:00:00.000Z",
        },
        {
            id: "comment_mc_002",
            authorName: "Second Visitor",
            content: "Second comment",
            createdAt: "2026-04-02T11:00:00.000Z",
        },
        {
            id: "comment_mc_003",
            authorName: "Third Visitor",
            content: "Third comment",
            createdAt: "2026-04-03T12:00:00.000Z",
        },
    ];

    test("shows correct count for multiple comments", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page, mockUserPublicProfile, multipleComments);

        await page.goto("/public-profile");

        await expect(page.getByText("First Visitor")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Second Visitor")).toBeVisible();
        await expect(page.getByText("Third Visitor")).toBeVisible();

        // Badge shows 3
        await expect(page.getByText("3", { exact: true })).toBeVisible();
    });

    test("each comment has its own delete button", async ({ page }) => {
        await mockAuth(page);
        await mockCommentManagementApi(page, mockUserPublicProfile, multipleComments);

        await page.goto("/public-profile");

        await expect(page.getByText("First Visitor")).toBeVisible({ timeout: 15_000 });

        // 3 delete buttons (one per comment)
        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        expect(await deleteBtns.count()).toBe(3);
    });
});
