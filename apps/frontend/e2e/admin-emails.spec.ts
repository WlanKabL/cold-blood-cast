import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import {
    adminUser,
    mockAdminEmailTemplates,
    mockAdminEmailVariables,
    mockAdminEmailLog,
} from "./helpers/fixtures";

test.describe("Admin Emails — Send Tab", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/emails/templates", mockAdminEmailTemplates);
        await mockGet(page, "/api/admin/emails/variables", mockAdminEmailVariables);
        await mockGet(page, "/api/admin/emails*", mockAdminEmailLog);
    });

    test("displays the email page", async ({ page }) => {
        await page.goto("/admin/emails");

        // Heading: "Email Center" or tab: "Send Email"
        await expect(page.getByText(/email center|send email|e-mail/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows test digest button", async ({ page }) => {
        await page.goto("/admin/emails");

        await expect(page.getByRole("button", { name: /test.*digest/i })).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows template selection", async ({ page }) => {
        await page.goto("/admin/emails");

        // Should have some template-related UI (select dropdown or label)
        await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Admin Emails — Log Tab", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/admin/emails/templates", mockAdminEmailTemplates);
        await mockGet(page, "/api/admin/emails/variables", mockAdminEmailVariables);
        await mockGet(page, "/api/admin/emails*", mockAdminEmailLog);
    });

    test("shows email log entries", async ({ page }) => {
        await page.goto("/admin/emails");

        // Click "Mail Log" tab
        const logTab = page.getByText(/mail log|protokoll/i).first();
        await logTab.click();

        // Wait for log entries to show
        await expect(
            page.locator("text=user@example.com").locator("visible=true").first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
