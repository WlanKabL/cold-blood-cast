import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import {
    adminUser,
    mockAdminReports,
    mockAdminReportsReviewed,
    mockReportStats,
} from "./helpers/fixtures";

// ─── Helper: Mock admin reports API ──────────────────────────

async function mockAdminReportsApi(
    page: import("@playwright/test").Page,
    reports = mockAdminReports,
    stats = mockReportStats,
) {
    // Reports list — intercept with dynamic status filtering
    await page.route("**/api/admin/reports**", (route) => {
        const url = route.request().url();

        // Stats endpoint
        if (url.includes("/stats")) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: stats }),
            });
        }

        // PATCH for resolve
        if (route.request().method() === "PATCH") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: {} }),
            });
        }

        // GET list — check status filter in URL
        if (route.request().method() === "GET") {
            if (url.includes("status=reviewed")) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: mockAdminReportsReviewed }),
                });
            }
            if (url.includes("status=dismissed")) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        success: true,
                        data: {
                            items: [],
                            meta: { page: 1, perPage: 20, total: 0, totalPages: 1 },
                        },
                    }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: reports }),
            });
        }

        return route.continue();
    });
}

// ═══════════════════════════════════════════════════════════════
// ─── Admin Reports Page ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

test.describe("Admin Reports Page", () => {
    test("shows page title", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.locator("h1")).toContainText(/report/i, { timeout: 15_000 });
    });

    test("displays status filter tabs with counts", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        // Tabs show translated status + count
        await expect(page.locator("button").filter({ hasText: /pending|ausstehend/i })).toBeVisible(
            { timeout: 15_000 },
        );
        await expect(
            page.locator("button").filter({ hasText: /reviewed|überprüft/i }),
        ).toBeVisible();
        await expect(
            page.locator("button").filter({ hasText: /dismissed|abgewiesen/i }),
        ).toBeVisible();
    });

    test("shows pending reports by default", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        // All 3 pending reports visible
        await expect(page.getByText("This is a spam comment")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Harassing content on the profile")).toBeVisible();
        await expect(page.getByText("Jane Reporter")).toBeVisible();
    });

    test("shows target type badges on reports", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        // Target type badges for comment, user_profile, pet_profile
        await expect(page.getByText(/comment/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows reason badges on reports", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText(/spam/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/harassment/i).first()).toBeVisible();
    });

    test("shows reporter name when available", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("John Doe")).toBeVisible();
    });

    test("shows review and dismiss action buttons on pending reports", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Check for action buttons (check-circle + x-circle icons)
        const reviewBtns = page.locator('[title*="review" i], [title*="überprüf" i]');
        const dismissBtns = page.locator(
            '[title*="dismiss" i], [title*="abweisen" i], [title*="ablehnen" i]',
        );

        expect(await reviewBtns.count()).toBeGreaterThanOrEqual(1);
        expect(await dismissBtns.count()).toBeGreaterThanOrEqual(1);
    });

    test("switching to reviewed tab shows reviewed reports", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        // Wait for page to load
        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Click reviewed tab
        const reviewedTab = page.locator("button").filter({ hasText: /reviewed|überprüft/i });
        await reviewedTab.click();

        // Should show reviewed report
        await expect(page.getByText("Offensive language")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Content removed and user warned")).toBeVisible();
        await expect(page.getByText(/Resolved by admin/i)).toBeVisible();
    });

    test("switching to dismissed tab shows empty state", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Click dismissed tab
        const dismissedTab = page.locator("button").filter({ hasText: /dismissed|abgewiesen/i });
        await dismissedTab.click();

        // Should show empty state
        await expect(
            page.locator("p").filter({ hasText: /no.*report|keine.*meldung/i }),
        ).toBeVisible({
            timeout: 15_000,
        });
    });

    test("clicking review button opens resolve modal", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Click review (check-circle) button on first report
        const reviewBtns = page.locator('[title*="review" i], [title*="überprüf" i]');
        await reviewBtns.first().click();

        // Resolve modal should appear
        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Has note textarea and confirm button
        await expect(modal.locator("textarea")).toBeVisible();
        await expect(
            modal.locator("button").filter({ hasText: /confirm|bestätigen/i }),
        ).toBeVisible();
    });

    test("clicking dismiss button opens resolve modal", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Click dismiss button
        const dismissBtns = page.locator(
            '[title*="dismiss" i], [title*="abweisen" i], [title*="ablehnen" i]',
        );
        await dismissBtns.first().click();

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });
    });

    test("resolve modal can be cancelled", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        const reviewBtns = page.locator('[title*="review" i], [title*="überprüf" i]');
        await reviewBtns.first().click();

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Cancel
        await modal
            .locator("button")
            .filter({ hasText: /cancel|abbrechen/i })
            .click();
        await expect(modal).not.toBeVisible({ timeout: 10_000 });
    });

    test("resolving a report sends PATCH request", async ({ page }) => {
        let patchBody: string | null = null;
        await mockAuth(page, adminUser);

        // Custom mock to capture the PATCH
        await page.route("**/api/admin/reports**", (route) => {
            const url = route.request().url();

            if (url.includes("/stats")) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: mockReportStats }),
                });
            }

            if (route.request().method() === "PATCH") {
                patchBody = route.request().postData();
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true, data: {} }),
                });
            }

            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: mockAdminReports }),
            });
        });

        await page.goto("/admin/reports");

        await expect(page.getByText("Jane Reporter")).toBeVisible({ timeout: 15_000 });

        // Click review
        const reviewBtns = page.locator('[title*="review" i], [title*="überprüf" i]');
        await reviewBtns.first().click();

        const modal = page.locator(".fixed.inset-0.z-50");
        await expect(modal).toBeVisible({ timeout: 10_000 });

        // Add admin note
        await modal.locator("textarea").fill("Content reviewed and action taken");

        // Confirm
        await modal
            .locator("button")
            .filter({ hasText: /confirm|bestätigen/i })
            .click();

        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 10_000 });

        // Verify PATCH was sent
        expect(patchBody).toBeTruthy();
        const parsed = JSON.parse(patchBody!);
        expect(parsed.status).toBe("reviewed");
        expect(parsed.adminNote).toBe("Content reviewed and action taken");
    });

    test("shows target URL link when available", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page);

        await page.goto("/admin/reports");

        // Reports have target URLs — check for external link
        const externalLinks = page.locator('a[target="_blank"]');
        await expect(externalLinks.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no reports exist", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockAdminReportsApi(page, {
            items: [],
            meta: { page: 1, perPage: 20, total: 0, totalPages: 1 },
        });

        await page.goto("/admin/reports");

        await expect(
            page.locator("p").filter({ hasText: /no.*report|keine.*meldung/i }),
        ).toBeVisible({
            timeout: 15_000,
        });
    });
});
