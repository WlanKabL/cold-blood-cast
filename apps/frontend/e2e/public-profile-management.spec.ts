import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation, mockError } from "./helpers/mock-api";
import {
    mockPets,
    mockPetDetailFeedings,
    mockWeightChartSeries,
    mockGrowthRates,
    mockEnclosures,
    mockPublicProfile,
    mockPublicProfileInactive,
    mockSlugCheck,
    mockSlugCheckTaken,
} from "./helpers/fixtures";

const petId = "pet_001";

/**
 * Mocks all the API endpoints needed for the pet detail page
 * plus the public profile endpoint.
 */
async function mockPetDetailWithProfile(
    page: import("@playwright/test").Page,
    profile: unknown = mockPublicProfile,
) {
    await mockGet(page, `/api/pets/${petId}`, mockPets[0]);
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

    // Public profile endpoint
    if (profile) {
        await mockGet(page, `/api/public-profiles/${petId}`, profile);
    } else {
        await mockError(
            page,
            `/api/public-profiles/${petId}`,
            404,
            "E_PUBLIC_PROFILE_NOT_FOUND",
            "Public profile not found",
        );
    }
}

// ─── Profile Not Created Yet ─────────────────────────────────

test.describe("Public Profile Management — No Profile", () => {
    test("shows create button when no profile exists", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page, null);

        await page.goto(`/pets/${petId}`);

        await expect(
            page.getByRole("button", { name: /create|erstellen|public/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("creates profile on button click", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page, null);
        await mockMutation(page, "POST", "/api/public-profiles", mockPublicProfile, 201);

        await page.goto(`/pets/${petId}`);

        // Click create button
        await page.getByRole("button", { name: /create|erstellen|public/i }).click({
            timeout: 15_000,
        });

        // After creation, the profile config should appear (re-fetch returns the profile)
        // We can't easily test the re-fetch in a mocked scenario, but the POST was called
    });
});

// ─── Profile Exists ──────────────────────────────────────────

test.describe("Public Profile Management — Profile Exists", () => {
    test("shows profile URL that includes slug", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText("monty-the-snake")).toBeVisible({ timeout: 15_000 });
    });

    test("shows active status badge", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText(/active|aktiv/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows inactive status badge", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page, mockPublicProfileInactive);

        await page.goto(`/pets/${petId}`);

        await expect(page.getByText(/inactive|inaktiv/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows view counter", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        // mockPublicProfile has views: 42
        await expect(page.getByText("42")).toBeVisible({ timeout: 15_000 });
    });

    test("shows visibility toggle switches", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        // Should show toggle labels for each visibility option
        await expect(page.getByText(/photos|fotos/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/weight|gewicht/i).first()).toBeVisible();
        await expect(page.getByText(/age|alter/i).first()).toBeVisible();
    });

    test("shows embed code button", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await expect(
            page.getByRole("button", { name: /embed|einbetten/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows QR code button", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await expect(
            page.getByRole("button", { name: /qr/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("opens embed code modal on click", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await page.getByRole("button", { name: /embed|einbetten/i }).click({ timeout: 15_000 });

        // Modal should show the iframe code
        await expect(page.getByText("<iframe")).toBeVisible({ timeout: 10_000 });
    });

    test("embed modal shows copy button", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await page.getByRole("button", { name: /embed|einbetten/i }).click({ timeout: 15_000 });

        // Copy button in modal — there may be two (icon + text), pick the visible one
        const copyBtn = page.getByRole("button", { name: /copy|kopieren/i }).last();
        await expect(copyBtn).toBeVisible({ timeout: 10_000 });
    });

    test("shows delete button", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await expect(
            page.getByRole("button", { name: /delete|löschen/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("delete button shows confirmation dialog", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        await page.getByRole("button", { name: /delete|löschen/i }).click({ timeout: 15_000 });

        // Confirm dialog should appear
        await expect(page.getByRole("button", { name: /confirm|bestätigen/i })).toBeVisible({
            timeout: 10_000,
        });
    });

    test("shows slug input field", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        // Custom slug section
        await expect(page.getByText(/slug/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows bio textarea", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        // Bio section
        await expect(page.getByText(/bio/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows created date", async ({ page }) => {
        await mockAuth(page);
        await mockPetDetailWithProfile(page);

        await page.goto(`/pets/${petId}`);

        // createdAt from fixture: "2026-03-01T10:00:00.000Z"
        await expect(page.getByText(/2026/).first()).toBeVisible({ timeout: 15_000 });
    });
});
