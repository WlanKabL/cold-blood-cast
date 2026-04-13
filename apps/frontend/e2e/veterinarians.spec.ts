import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockVeterinariansWithCounts } from "./helpers/fixtures";

test.describe("Veterinarians — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/veterinarians", mockVeterinariansWithCounts);
    });

    test("loads and displays veterinarians", async ({ page }) => {
        await page.goto("/veterinarians");

        await expect(page.locator("h1")).toContainText(/veterinarian|tierärzt/i, {
            timeout: 15_000,
        });
        await expect(page.getByText("Dr. Schmidt").first()).toBeVisible();
        await expect(page.getByText("Dr. Müller").first()).toBeVisible();
    });

    test("shows clinic name", async ({ page }) => {
        await page.goto("/veterinarians");

        await expect(page.getByText("Reptile Clinic Berlin").first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/veterinarians");

        const addBtn = page.getByRole("button", { name: /add vet|tierarzt|add|hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/veterinarians");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add vet|tierarzt|add|hinzufügen/i });
        await addBtn.click();

        await expect(page.getByRole("heading", { name: /new vet|neuer tierarzt/i })).toBeVisible({
            timeout: 10_000,
        });
    });
});

test.describe("Veterinarians — Empty State", () => {
    test("shows empty state when no vets", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/veterinarians", []);

        await page.goto("/veterinarians");

        await expect(page.getByText(/no vet|kein tierarzt|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
