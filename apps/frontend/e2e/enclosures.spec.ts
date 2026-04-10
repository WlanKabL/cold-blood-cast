import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import { mockEnclosures } from "./helpers/fixtures";

test.describe("Enclosures — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", mockEnclosures);
    });

    test("loads and displays enclosures", async ({ page }) => {
        await page.goto("/enclosures");

        await expect(page.locator("h1")).toContainText(/enclosure|terrari/i, { timeout: 15_000 });
        await expect(page.getByText("Main Vivarium").first()).toBeVisible();
    });

    test("shows enclosure type badge", async ({ page }) => {
        await page.goto("/enclosures");

        await expect(page.getByText("TERRARIUM").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows room information", async ({ page }) => {
        await page.goto("/enclosures");

        await expect(page.getByText("Living Room").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows pet and sensor counts", async ({ page }) => {
        await page.goto("/enclosures");

        // enc_001 has 2 pets and 1 sensor
        await expect(page.getByText("2").first()).toBeVisible({ timeout: 15_000 });
    });

    test("enclosure cards link to detail pages", async ({ page }) => {
        await page.goto("/enclosures");

        const encLink = page.locator("a[href='/enclosures/enc_001']");
        await expect(encLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/enclosures");

        const addBtn = page.getByRole("button", { name: /add enclosure|terrarium hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/enclosures");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add enclosure|terrarium hinzufügen/i });
        await addBtn.click();

        // Modal title should be visible
        await expect(page.getByText(/new enclosure|neues terrarium/i)).toBeVisible({ timeout: 10_000 });
    });

    test("search filters enclosures", async ({ page }) => {
        await page.goto("/enclosures");

        const searchInput = page.locator("input[type='text']").first();
        await searchInput.waitFor({ state: "visible", timeout: 15_000 });
        await searchInput.fill("Quarantine");

        await page.waitForTimeout(500);
    });

    test("filter buttons switch between active/archived", async ({ page }) => {
        await page.goto("/enclosures");

        // Look for filter buttons
        const activeBtn = page.getByRole("button", { name: /active|aktiv/i }).first();
        const archivedBtn = page.getByRole("button", { name: /archived|archiviert/i }).first();

        await expect(activeBtn).toBeVisible({ timeout: 15_000 });
        await expect(archivedBtn).toBeVisible();
    });

    test("shows archived badge for inactive enclosures", async ({ page }) => {
        await page.goto("/enclosures");

        // enc_002 "Quarantine Box" is inactive
        await expect(page.getByText("Quarantine Box").first()).toBeVisible({ timeout: 15_000 });
    });
});

test.describe("Enclosures — Empty State", () => {
    test("shows empty state when no enclosures exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/enclosures", []);

        await page.goto("/enclosures");

        // Empty state text
        await expect(page.getByText(/no enclosures|keine terrarien/i).first()).toBeVisible({ timeout: 15_000 });
    });
});
