import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { adminUser } from "./helpers/fixtures";

const mockGlobalTags = [
    {
        id: "tag_001",
        name: "Healthy",
        userId: null,
        category: "care",
        color: "#22c55e",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
        id: "tag_002",
        name: "Urgent",
        userId: null,
        category: "vet",
        color: "#ef4444",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
        id: "tag_003",
        name: "Feeding Day",
        userId: null,
        category: "care",
        color: "#f59e0b",
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
    },
];

test.describe("Admin Tags", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/tags/admin/global", mockGlobalTags);
    });

    test("loads admin tags page with title", async ({ page }) => {
        await page.goto("/admin/tags");

        await expect(
            page.getByText(/global tags|globale tags/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("displays tags grouped by category", async ({ page }) => {
        await page.goto("/admin/tags");

        await expect(page.getByText("Healthy").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Urgent").first()).toBeVisible();
        await expect(page.getByText("Feeding Day").first()).toBeVisible();
    });

    test("shows category headers", async ({ page }) => {
        await page.goto("/admin/tags");

        await expect(page.getByText(/care|pflege/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/vet|tierarzt/i).first()).toBeVisible();
    });

    test("shows create button", async ({ page }) => {
        await page.goto("/admin/tags");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on button click", async ({ page }) => {
        await page.goto("/admin/tags");

        const createBtn = page.getByRole("button", { name: /create|erstellen|new|neu/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
        await createBtn.click();

        await expect(page.getByPlaceholder(/healthy|urgent|follow-up/i).first()).toBeVisible();
    });

    test("shows edit and delete buttons per tag", async ({ page }) => {
        await page.goto("/admin/tags");

        await expect(page.getByText("Healthy").first()).toBeVisible({ timeout: 15_000 });

        // Edit buttons (pencil icons)
        const editButtons = page.getByTitle(/edit|bearbeiten/i);
        await expect(editButtons.first()).toBeVisible();

        // Delete buttons (trash icons)
        const deleteButtons = page.getByTitle(/delete|löschen/i);
        await expect(deleteButtons.first()).toBeVisible();
    });
});

test.describe("Admin Tags — Empty State", () => {
    test("shows empty state when no tags exist", async ({ page }) => {
        await mockAuth(page, adminUser);
        await mockGet(page, "/api/tags/admin/global", []);

        await page.goto("/admin/tags");

        await expect(
            page.getByText(/no.*tag|keine.*tag/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
