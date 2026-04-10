import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation, mockDelete } from "./helpers/mock-api";
import { mockPets, mockPetPhotos } from "./helpers/fixtures";

const petId = "pet_001";

test.describe("Pet Photos — Gallery", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/photos`, mockPetPhotos);
    });

    test("loads gallery with photos", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        await expect(page.locator("h1")).toContainText("Monty", { timeout: 15_000 });
        // Should render 2 photos from fixtures
        const images = page.locator("img[loading='lazy']");
        await expect(images).toHaveCount(2, { timeout: 15_000 });
    });

    test("shows profile badge on profile photo", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        // photo_001 has isProfilePicture: true — badge text
        await expect(page.getByText(/profile/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows upload button", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens upload modal with file input", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();
        await expect(page.locator("input[type='file']")).toBeAttached();
    });

    test("upload modal has datetime field", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        // datetime-local input for takenAt
        const dateInput = page.locator("input[type='datetime-local']");
        await expect(dateInput).toBeVisible({ timeout: 10_000 });
    });

    test("shows tag filter bar", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        // Tags from fixtures: "portrait", "shedding", "feeding"
        await expect(page.getByText("portrait").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("shedding").first()).toBeVisible();
        await expect(page.getByText("feeding").first()).toBeVisible();
    });

    test("tag filter limits displayed photos", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        // Click the "feeding" tag filter button
        await page.getByRole("button", { name: "feeding" }).click();

        // Only photo_002 has "feeding" tag — should show 1 image
        const images = page.locator("img[loading='lazy']");
        await expect(images).toHaveCount(1, { timeout: 15_000 });
    });

    test("back link points to pet detail", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        const backLink = page.locator(`a[href='/pets/${petId}']`);
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });

    test("clicking a photo opens lightbox", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        const firstPhoto = page.locator("img[loading='lazy']").first();
        await firstPhoto.waitFor({ state: "visible", timeout: 15_000 });
        // Force click to bypass the hover overlay that intercepts pointer events
        await firstPhoto.click({ force: true });

        // Lightbox opens as a fullscreen overlay with a counter like "1 / 2" (with spaces)
        await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible({ timeout: 5_000 });
    });
});

test.describe("Pet Photos — Empty State", () => {
    test("shows empty state when no photos exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/photos`, []);

        await page.goto(`/pets/${petId}/photos`);

        // Empty state text
        await expect(page.getByText(/no photos|keine fotos/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("empty state still has upload button", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/photos`, []);

        await page.goto(`/pets/${petId}/photos`);

        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn.first()).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Pet Photos — Actions", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
        await mockGet(page, `/api/pets/${petId}/photos`, mockPetPhotos);
    });

    test("hovering a photo reveals action buttons", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        const firstPhotoCard = page.locator(".group").filter({ has: page.locator("img[loading='lazy']") }).first();
        await firstPhotoCard.hover();

        // Should see edit and delete buttons on hover overlay
        await expect(firstPhotoCard.locator("button").first()).toBeVisible({ timeout: 5_000 });
    });

    test("delete action shows confirmation dialog", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);

        const firstPhotoCard = page.locator(".group").filter({ has: page.locator("img[loading='lazy']") }).first();
        await firstPhotoCard.hover();

        // Click the last button (delete is last in hover actions)
        const deleteBtn = firstPhotoCard.locator("button").last();
        await deleteBtn.click();

        // Confirm dialog should appear
        await expect(page.getByRole("button", { name: /delete|löschen/i }).last()).toBeVisible({ timeout: 10_000 });
    });
});
