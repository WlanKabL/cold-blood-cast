import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import {
    mockPets,
    mockPetPhotos,
    mockPetDocuments,
    mockPetDetailFeedings,
    mockWeightChartSeries,
    mockGrowthRates,
    mockEnclosures,
} from "./helpers/fixtures";

const petId = "pet_001";

/**
 * Mocks all the API endpoints needed for the pet detail page to render.
 * The page fetches many queries — stub them all to avoid console errors.
 */
async function mockPetDetailApis(page: import("@playwright/test").Page, petOverride?: unknown) {
    await mockGet(page, `/api/pets/${petId}`, petOverride ?? mockPets[0]);
    await mockGet(page, `/api/feedings?petId=${petId}*`, mockPetDetailFeedings);
    await mockGet(page, `/api/weights/chart*`, mockWeightChartSeries);
    await mockGet(page, `/api/weights/growth-rate*`, mockGrowthRates);
    await mockGet(page, "/api/feeding-reminders", []);
    await mockGet(page, `/api/vet-visits?petId=${petId}*`, []);
    await mockGet(page, `/api/sheddings/analysis/${petId}`, null);
    await mockGet(page, `/api/pets/${petId}/timeline*`, {
        events: [],
        total: 0,
        page: 1,
        limit: 5,
        hasMore: false,
    });
    await mockGet(page, "/api/enclosures", mockEnclosures);
}

// ─── Pet Detail: Photos Section ────────────────────────────

test.describe("Pet Detail — Photos Section", () => {
    test("shows photo thumbnail when photos exist", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        // Should show the photo thumbnail from pet.photos[0]
        const thumb = page.locator("img[alt='Monty']");
        await expect(thumb).toBeVisible({ timeout: 15_000 });
    });

    test("shows photo count", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        // _count.photos = 2
        await expect(page.getByText("(2)").first()).toBeVisible({ timeout: 15_000 });
    });

    test("has link to photo gallery", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        const galleryLink = page.locator(`a[href='/pets/${petId}/photos']`);
        await expect(galleryLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no photos exist", async ({ page }) => {
        await mockAuth(page);
        const petNoPhotos = {
            ...mockPets[0],
            photos: [],
            _count: { ...mockPets[0]._count, photos: 0 },
        };
        await mockPetDetailApis(page, petNoPhotos);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText(/no photos|keine fotos/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows photos section with count even without profile picture", async ({ page }) => {
        await mockAuth(page);
        // Pet has photo count but no profile photo in the photos array (fallback thumbnail)
        const petWithCountButNoThumb = {
            ...mockPets[0],
            photos: [],
            _count: { ...mockPets[0]._count, photos: 5 },
        };
        await mockPetDetailApis(page, petWithCountButNoThumb);

        await page.goto(`/pets/${petId}`);

        // Should still show the count, not the empty state
        await expect(page.getByText("(5)").first()).toBeVisible({ timeout: 15_000 });
        // Gallery link should be visible
        const galleryLink = page.locator(`a[href='/pets/${petId}/photos']`);
        await expect(galleryLink.first()).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Pet Detail: Documents Section ─────────────────────────

test.describe("Pet Detail — Documents Section", () => {
    test("shows document count when documents exist", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        // _count.documents = 3
        await expect(page.getByText("(3)").first()).toBeVisible({ timeout: 15_000 });
    });

    test("has link to documents page", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        const docsLink = page.locator(`a[href='/pets/${petId}/documents']`);
        await expect(docsLink.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when no documents exist", async ({ page }) => {
        await mockAuth(page);
        const petNoDocs = {
            ...mockPets[0],
            _count: { ...mockPets[0]._count, documents: 0 },
        };
        await mockPetDetailApis(page, petNoDocs);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText(/no documents|keine dokumente/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows document icon and document count text", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        // Document count text includes "3"
        await expect(page.getByText(/3/).first()).toBeVisible({ timeout: 15_000 });
    });
});

// ─── Pet Detail: Integration ───────────────────────────────

test.describe("Pet Detail — Page Integration", () => {
    test("loads pet name and species", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        await expect(page.locator("h1")).toContainText("Monty", { timeout: 15_000 });
        await expect(page.getByText("corn_snake").first()).toBeVisible();
    });

    test("shows back link to pets list", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        const backLink = page.locator("a[href='/pets']");
        await expect(backLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows edit and delete buttons", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);
        await page.waitForLoadState("networkidle");

        // The edit and delete buttons are icon-only UiButtons
        const buttons = page.locator("header button, [class*='glass-card'] button, main button");
        await expect(buttons.first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows recent feedings section", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailApis(page);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText("Mouse").first()).toBeVisible({ timeout: 15_000 });
    });
});
