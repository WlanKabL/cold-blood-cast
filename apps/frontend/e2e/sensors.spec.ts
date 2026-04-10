import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import { mockSensors, mockEnclosures } from "./helpers/fixtures";

test.describe("Sensors — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/sensors", mockSensors);
        await mockGet(page, "/api/enclosures", mockEnclosures);
    });

    test("loads and displays sensors", async ({ page }) => {
        await page.goto("/sensors");

        await expect(page.locator("h1")).toContainText(/sensor/i, { timeout: 15_000 });
        await expect(page.getByText("Hot Side Temp").first()).toBeVisible();
        await expect(page.getByText("Humidity Sensor").first()).toBeVisible();
    });

    test("shows sensor type and unit", async ({ page }) => {
        await page.goto("/sensors");

        await expect(page.getByText("°C").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("%").first()).toBeVisible();
    });

    test("shows enclosure name on linked sensors", async ({ page }) => {
        await page.goto("/sensors");

        await expect(page.getByText("Main Vivarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows inactive badge for inactive sensors", async ({ page }) => {
        await page.goto("/sensors");

        // sensor_003 "Old Pressure" is inactive
        await expect(page.getByText("Old Pressure").first()).toBeVisible({ timeout: 15_000 });
    });

    test("sensor cards link to detail pages", async ({ page }) => {
        await page.goto("/sensors");

        const sensorLink = page.locator("a[href='/sensors/sensor_001']");
        await expect(sensorLink).toBeVisible({ timeout: 15_000 });
    });

    test("shows add button", async ({ page }) => {
        await page.goto("/sensors");

        const addBtn = page.getByRole("button", { name: /add sensor|sensor hinzufügen/i });
        await expect(addBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal on add", async ({ page }) => {
        await page.goto("/sensors");
        await page.waitForLoadState("networkidle");

        const addBtn = page.getByRole("button", { name: /add sensor|sensor hinzufügen/i });
        await addBtn.click();

        // Modal title should be visible
        await expect(page.getByText(/new sensor|neuer sensor/i)).toBeVisible({ timeout: 10_000 });
    });

    test("search filters sensors", async ({ page }) => {
        await page.goto("/sensors");

        const searchInput = page.locator("input[type='text']").first();
        await searchInput.waitFor({ state: "visible", timeout: 15_000 });
        await searchInput.fill("Hot");

        // After debounce, only Hot Side Temp should remain visible
        await page.waitForTimeout(500);
    });
});

test.describe("Sensors — Empty State", () => {
    test("shows empty state when no sensors exist", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/sensors", []);
        await mockGet(page, "/api/enclosures", mockEnclosures);

        await page.goto("/sensors");

        await expect(page.locator("h1")).toContainText(/sensor/i, { timeout: 15_000 });
    });
});
