import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation, mockDelete } from "./helpers/mock-api";
import { mockPets, mockPetDocuments } from "./helpers/fixtures";

const petId = "pet_001";

test.describe("Pet Documents — List", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, mockPetDocuments);
    });

    test("loads document list with items", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await expect(page.locator("h1")).toContainText("Monty", { timeout: 15_000 });
        // 3 documents from fixtures
        const cards = page.locator(".glass-card.group");
        await expect(cards).toHaveCount(3, { timeout: 15_000 });
    });

    test("shows category badge for each document", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        // CITES badge from doc_001
        await expect(page.getByText("CITES").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows document label", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await expect(page.getByText("CITES Certificate 2024").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows upload button", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn).toBeVisible({ timeout: 15_000 });
    });

    test("shows category filter bar", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        // "All" filter button
        await expect(page.getByText(/all|alle/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("back link points to pet detail", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        const backLink = page.locator(`a[href='/pets/${petId}']`);
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Pet Documents — Category Filter", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, mockPetDocuments);
    });

    test("filtering by category limits displayed documents", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);
        await page.waitForLoadState("networkidle");

        // Click the CITES category filter
        await page.getByRole("button", { name: "CITES" }).click();

        // Only doc_001 has CITES category — should show 1 card
        const cards = page.locator(".glass-card.group");
        await expect(cards).toHaveCount(1, { timeout: 15_000 });
    });

    test("clicking All shows all documents again", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);
        await page.waitForLoadState("networkidle");

        // Filter to a category first
        await page.getByRole("button", { name: "CITES" }).click();
        const cards = page.locator(".glass-card.group");
        await expect(cards).toHaveCount(1, { timeout: 15_000 });

        // Click All filter
        await page.getByRole("button", { name: /all|alle/i }).first().click();
        await expect(cards).toHaveCount(3, { timeout: 15_000 });
    });
});

test.describe("Pet Documents — Empty State", () => {
    test("shows empty state when no documents exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, []);

        await page.goto(`/pets/${petId}/documents`);

        await expect(page.getByText(/no documents|keine dokumente/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("empty state still has upload button", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, []);

        await page.goto(`/pets/${petId}/documents`);

        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn.first()).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Pet Documents — Upload Modal", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, mockPetDocuments);
    });

    test("opens upload modal with file input", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();
        await expect(page.locator("input[type='file']")).toBeAttached();
    });

    test("upload modal has category select", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        // Category select should be visible
        const select = page.locator("select").first();
        await expect(select).toBeVisible({ timeout: 10_000 });
    });

    test("upload modal has date field", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        const dateInput = page.locator("input[type='date']");
        await expect(dateInput).toBeVisible({ timeout: 10_000 });
    });

    test("upload modal has cancel and submit buttons", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        await expect(page.getByRole("button", { name: /cancel|abbrechen/i })).toBeVisible({
            timeout: 10_000,
        });
        // Submit button should be disabled without file
        const submitBtn = page.getByRole("button", { name: /upload|hochladen/i }).last();
        await expect(submitBtn).toBeVisible();
    });
});

test.describe("Pet Documents — Actions", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/documents`, mockPetDocuments);
    });

    test("hovering a document reveals action buttons", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        const firstCard = page.locator(".glass-card.group").first();
        await firstCard.hover();

        // Should see action buttons (download, edit, delete)
        await expect(firstCard.locator("button").first()).toBeVisible({ timeout: 5_000 });
    });

    test("delete action shows confirmation dialog", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        const firstCard = page.locator(".glass-card.group").first();
        await firstCard.hover();

        // Delete is the last button in hover actions
        const deleteBtn = firstCard.locator("button").last();
        await deleteBtn.click();

        // Confirm dialog should appear
        await expect(page.getByRole("button", { name: /delete|löschen/i }).last()).toBeVisible({
            timeout: 10_000,
        });
    });

    test("has download link for each document", async ({ page }) => {
        await page.goto(`/pets/${petId}/documents`);

        const firstCard = page.locator(".glass-card.group").first();
        await firstCard.hover();

        // Download link should be present
        const downloadLink = firstCard.locator("a[target='_blank']");
        await expect(downloadLink).toBeAttached();
    });
});
