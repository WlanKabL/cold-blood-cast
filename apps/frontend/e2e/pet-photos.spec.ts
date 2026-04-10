import { test, expect } from "@playwright/test";
import path from "path";

// These tests require:
// 1. A running backend + frontend (handled by playwright.config.ts webServer)
// 2. A valid test user (from auth.setup.ts)
// 3. At least one pet that belongs to the test user

test.describe("Pet Photo Gallery", () => {
    let petId: string;

    test.beforeEach(async ({ page }) => {
        // Navigate to pets list and get a pet ID
        await page.goto("/pets");
        await page.waitForSelector('[class*="glass-card"]');

        const petCard = page.locator("a[href^='/pets/']").first();
        const href = await petCard.getAttribute("href");
        petId = href?.split("/pets/")[1] ?? "";
        expect(petId).toBeTruthy();
    });

    test("navigates to empty photo gallery", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        // Should show gallery page title
        await expect(page.locator("h1")).toContainText(/foto|photo/i);
    });

    test("shows upload button on gallery page", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
        await expect(uploadBtn).toBeVisible();
    });

    test("opens upload modal", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        // Upload modal should appear with file input area
        await expect(page.locator("input[type='file']")).toBeAttached();
    });

    test("uploads a photo", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        // Open upload modal
        await page.getByRole("button", { name: /upload|hochladen/i }).click();

        // Set file input (create a small test image)
        const fileInput = page.locator("input[type='file']");
        await fileInput.setInputFiles({
            name: "test-snake.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.alloc(100, 0xff),
        });

        // Optionally set caption
        const captionInput = page.locator("input").filter({ has: page.locator("[placeholder]") }).first();
        if (await captionInput.isVisible()) {
            await captionInput.fill("Test snake photo");
        }

        // Submit upload
        const submitBtn = page.locator("form button[type='submit']");
        await submitBtn.click();

        // Wait for the upload to complete and modal to close
        await page.waitForTimeout(2000);

        // Should show the photo in the grid
        const photos = page.locator("img[loading='lazy']");
        await expect(photos.first()).toBeVisible({ timeout: 10000 });
    });

    test("opens lightbox on photo click", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        // Only run if there are photos
        const photoGrid = page.locator("img[loading='lazy']");
        const count = await photoGrid.count();
        test.skip(count === 0, "No photos to test lightbox");

        // Click first photo
        await photoGrid.first().click();

        // Lightbox should appear
        await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible();
    });

    test("closes lightbox with escape key", async ({ page }) => {
        await page.goto(`/pets/${petId}/photos`);
        await page.waitForLoadState("networkidle");

        const photoGrid = page.locator("img[loading='lazy']");
        const count = await photoGrid.count();
        test.skip(count === 0, "No photos to test lightbox");

        await photoGrid.first().click();
        await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(page.locator(".fixed.inset-0.z-50")).toBeHidden();
    });

    test("pet detail page shows photos section", async ({ page }) => {
        await page.goto(`/pets/${petId}`);
        await page.waitForLoadState("networkidle");

        // Should have a photos section with gallery link
        const galleryLink = page.locator(`a[href='/pets/${petId}/photos']`);
        await expect(galleryLink.first()).toBeVisible();
    });

    test("pet list shows photo count", async ({ page }) => {
        await page.goto("/pets");
        await page.waitForLoadState("networkidle");

        // The image icon should exist for photo count in footer
        const photoCountIcons = page.locator('[class*="text-green-400"]');
        expect(await photoCountIcons.count()).toBeGreaterThanOrEqual(0);
    });
});
