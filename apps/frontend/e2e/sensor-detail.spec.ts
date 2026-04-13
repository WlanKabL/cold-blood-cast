import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet } from "./helpers/mock-api";
import { mockSensorDetail, mockSensorReadings, mockEnclosures } from "./helpers/fixtures";

test.describe("Sensor Detail Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/sensors/sensor_001", mockSensorDetail);
        await mockGet(page, "/api/sensors/sensor_001/readings", mockSensorReadings);
        await mockGet(page, "/api/enclosures", mockEnclosures);
    });

    test("displays sensor name", async ({ page }) => {
        await page.goto("/sensors/sensor_001");

        await expect(page.getByText("Hot Side Temp").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows sensor type", async ({ page }) => {
        await page.goto("/sensors/sensor_001");

        await expect(page.getByText(/temperature|temperatur/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("shows sensor unit", async ({ page }) => {
        await page.goto("/sensors/sensor_001");

        await expect(page.getByText("°C").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows enclosure name", async ({ page }) => {
        await page.goto("/sensors/sensor_001");

        await expect(page.getByText("Main Vivarium").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows back button", async ({ page }) => {
        await page.goto("/sensors/sensor_001");

        const backLink = page
            .locator("a[href='/sensors']")
            .or(page.getByRole("button", { name: /back|zurück/i }));
        await expect(backLink.first()).toBeVisible({ timeout: 15_000 });
    });
});
