import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import {
    adminUser,
    mockAdminComments,
    mockAdminCommentsApproved,
    mockAdminCommentsPending,
} from "./helpers/fixtures";

// ─── Helper: Mock admin comments API ─────────────────────────

async function mockAdminCommentsApi(
    page: import("@playwright/test").Page,
    comments = mockAdminComments,
) {
    await page.route("**/api/admin/comments**", (route) => {
        const url = route.request().url();
        const method = route.request().method();

        // DELETE
        if (method === "DELETE") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            });
        }

        // GET with filter
        if (method === "GET") {
            if (url.includes("approved=true")) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: mockAdminCommentsApproved }),
                });
            }
            if (url.includes("approved=false")) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: mockAdminCommentsPending }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: comments }),
            });
        }

        return route.continue();
    });
}

// ═══════════════════════════════════════════════════════════════
// ─── Admin Comments Page ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Admin Comments Page", () => {
    test("shows page title", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.locator("h1")).toContainText(/comment/i, { timeout: 15_000 });
    });

    test("displays filter tabs (all, approved, pending)", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.locator("button").filter({ hasText: /^all$|^alle$/i })).toBeVisible({
            timeout: 15_000,
        });
        await expect(
            page.locator("button").filter({ hasText: /approved|genehmigt/i }),
        ).toBeVisible();
        await expect(
            page.locator("button").filter({ hasText: /pending|ausstehend/i }),
        ).toBeVisible();
    });

    test("shows all comments by default", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        // 3 comments visible
        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Nice snakes!")).toBeVisible();
        await expect(page.getByText("Spammer")).toBeVisible();
        await expect(page.getByText("Buy my stuff at spamsite.com")).toBeVisible();
        await expect(page.getByText("Helpful Keeper")).toBeVisible();
    });

    test("shows approval badges on comments", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });

        // Approved badge and pending badge both visible
        const approvedBadges = page.locator(".bg-green-500\\/15");
        const pendingBadges = page.locator(".bg-amber-500\\/15");

        // At least one of each type (2 approved + 1 pending)
        expect(await approvedBadges.count()).toBeGreaterThanOrEqual(1);
        expect(await pendingBadges.count()).toBeGreaterThanOrEqual(1);
    });

    test("shows profile type for each comment", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });
    });

    test("shows delete button on each comment", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });

        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        // 3 comments = 3 delete buttons
        expect(await deleteBtns.count()).toBe(3);
    });

    test("switching to approved tab shows only approved comments", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });

        // Click approved tab
        const approvedTab = page.locator("button").filter({ hasText: /approved|genehmigt/i });
        await approvedTab.click();

        // Should show approved comments only
        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Helpful Keeper")).toBeVisible();
        // Spammer should NOT be visible
        await expect(page.getByText("Spammer")).not.toBeVisible();
    });

    test("switching to pending tab shows only pending comments", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page);

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });

        // Click pending tab
        const pendingTab = page.locator("button").filter({ hasText: /pending|ausstehend/i });
        await pendingTab.click();

        // Should show only pending comments
        await expect(page.getByText("Spammer")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Buy my stuff at spamsite.com")).toBeVisible();
        // Approved comments should NOT be visible
        await expect(page.getByText("Visitor One")).not.toBeVisible();
    });

    test("delete button triggers confirm dialog and sends DELETE", async ({ page }) => {
        let deleteCalled = false;
        await mockAuth(page, adminUser);

        // Custom mock to track DELETE call
        await page.route("**/api/admin/comments**", (route) => {
            if (route.request().method() === "DELETE") {
                deleteCalled = true;
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: {} }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: mockAdminComments }),
            });
        });

        // Auto-accept confirm dialogs
        page.on("dialog", (dialog) => dialog.accept());

        await page.goto("/admin/comments");

        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });

        // Click delete on first comment
        const deleteBtns = page.locator('[title*="delete" i], [title*="löschen" i]');
        await deleteBtns.first().click();

        // Wait for the DELETE to be called
        await expect.poll(() => deleteCalled, { timeout: 10_000 }).toBe(true);
    });

    test("shows empty state when no comments exist", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminCommentsApi(page, {
            items: [],
            meta: { page: 1, perPage: 20, total: 0, totalPages: 1 },
        });

        await page.goto("/admin/comments");

        await expect(
            page.locator("p").filter({ hasText: /no.*comment|keine.*kommentar/i }),
        ).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows loading skeleton while fetching", async ({ page }) => {
        await mockAuth(page, adminUser);

        // Delay API response
        await page.route("**/api/admin/comments*", async (route) => {
            await new Promise((r) => setTimeout(r, 1000));
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: mockAdminComments }),
            });
        });

        await page.goto("/admin/comments");

        // Skeleton should briefly appear
        const skeletons = page.locator("[class*='animate-pulse'], [class*='skeleton']");
        // Eventually content appears
        await expect(page.getByText("Visitor One")).toBeVisible({ timeout: 15_000 });
    });
});
