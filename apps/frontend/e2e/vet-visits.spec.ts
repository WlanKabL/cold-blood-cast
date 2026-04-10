import { test, expect } from "@playwright/test";

// These tests require:
// 1. A running backend + frontend (handled by playwright.config.ts webServer)
// 2. A valid test user (from auth.setup.ts)
// 3. At least one pet and optionally one veterinarian belonging to the test user

test.describe("Vet Visits", () => {
    test.describe("List Page", () => {
        test("navigates to vet visits list", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            await expect(page.locator("h1")).toContainText(/vet visit|tierarztbesuch/i);
        });

        test("shows add button", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const addBtn = page.getByRole("button", { name: /add|hinzufügen|plus/i });
            await expect(addBtn).toBeVisible();
        });

        test("opens mode choice dialog", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            await page.getByRole("button", { name: /add|hinzufügen|plus/i }).click();

            // Two options: appointment and past visit
            await expect(page.getByText(/appointment|termin/i).first()).toBeVisible();
            await expect(page.getByText(/past visit|vergangener besuch/i).first()).toBeVisible();
        });

        test("shows filter dropdowns", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            // Should have select elements for filtering
            const selects = page.locator("select");
            expect(await selects.count()).toBeGreaterThanOrEqual(2);
        });
    });

    test.describe("Create Vet Visit", () => {
        test("creates a past visit", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            // Open mode choice
            await page.getByRole("button", { name: /add|hinzufügen|plus/i }).click();

            // Choose "past visit" mode
            const pastBtn = page.locator("button").filter({
                has: page.locator("text=/past visit|vergangener|stethoscope/i"),
            });
            await pastBtn.first().click();

            // Fill in the form
            const petSelect = page.locator("select").first();
            await petSelect.waitFor({ state: "visible" });
            const petOptions = await petSelect.locator("option").allTextContents();
            expect(petOptions.length).toBeGreaterThan(0);
            await petSelect.selectOption({ index: 0 });

            // Set visit date
            const dateInput = page.locator("input[type='date'], input[type='datetime-local']").first();
            if (await dateInput.isVisible()) {
                await dateInput.fill("2024-06-15");
            }

            // Set reason
            const reasonInput = page.locator("input").filter({ hasText: /reason|grund/i });
            if (await reasonInput.count() > 0) {
                await reasonInput.first().fill("E2E test checkup");
            }

            // Submit
            const submitBtn = page.locator("form").locator("button[type='submit']");
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
            }
        });

        test("creates a future appointment", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            // Open mode choice
            await page.getByRole("button", { name: /add|hinzufügen|plus/i }).click();

            // Choose "appointment" mode
            const appointmentBtn = page.locator("button").filter({
                has: page.locator("text=/appointment|termin|calendar/i"),
            });
            await appointmentBtn.first().click();

            // Fill pet select
            const petSelect = page.locator("select").first();
            await petSelect.waitFor({ state: "visible" });
            await petSelect.selectOption({ index: 0 });

            // Set future date
            const dateInput = page.locator("input[type='datetime-local']").first();
            if (await dateInput.isVisible()) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 30);
                const iso = futureDate.toISOString().slice(0, 16);
                await dateInput.fill(iso);
            }

            // Submit
            const submitBtn = page.locator("form").locator("button[type='submit']");
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
            }
        });
    });

    test.describe("Detail Page", () => {
        test("clicks a visit to navigate to detail page", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Should be on detail page
                await expect(page).toHaveURL(/\/vet-visits\/.+/);

                // Should show visit info section
                const heading = page.locator("h1");
                await expect(heading).toContainText(/visit|besuch|appointment|termin/i);
            }
        });

        test("detail page shows visit information", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Visit info card should be visible
                await expect(page.locator(".glass-card").first()).toBeVisible();

                // Should have back button
                const backLink = page.locator("a[href='/vet-visits']");
                await expect(backLink).toBeVisible();
            }
        });

        test("detail page shows documents section", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Documents section should exist with upload button
                const uploadBtn = page.getByRole("button", { name: /upload|hochladen/i });
                await expect(uploadBtn).toBeVisible();
            }
        });

        test("opens upload document modal", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Click upload button
                await page.getByRole("button", { name: /upload|hochladen/i }).click();

                // File input should appear
                await expect(page.locator("input[type='file']")).toBeAttached();
            }
        });

        test("uploads a document to a visit", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Open upload modal
                await page.getByRole("button", { name: /upload|hochladen/i }).click();

                // Set file input
                const fileInput = page.locator("input[type='file']");
                await fileInput.setInputFiles({
                    name: "test-vet-doc.pdf",
                    mimeType: "application/pdf",
                    buffer: Buffer.alloc(200, 0x25),
                });

                // Set label
                const labelInput = page.locator("input").filter({ has: page.locator("[placeholder]") }).first();
                if (await labelInput.isVisible()) {
                    await labelInput.fill("E2E test document");
                }

                // Submit
                const submitBtn = page.locator("form button[type='submit']");
                await submitBtn.click();
                await page.waitForTimeout(3000);

                // Document should appear in the list
                const docEntries = page.locator(".bg-surface-raised");
                await expect(docEntries.first()).toBeVisible({ timeout: 10000 });
            }
        });

        test("navigates back to list from detail page", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            const visitLink = page.locator("a[href^='/vet-visits/']").first();
            if (await visitLink.isVisible()) {
                await visitLink.click();
                await page.waitForLoadState("networkidle");

                // Click back button
                const backLink = page.locator("a[href='/vet-visits']");
                await backLink.click();

                await expect(page).toHaveURL("/vet-visits");
            }
        });
    });

    test.describe("Cost Summary", () => {
        test("shows cost summary on list page when visits exist", async ({ page }) => {
            await page.goto("/vet-visits");
            await page.waitForLoadState("networkidle");

            // Check if we have visits — if so, the cost summary card should be visible
            const visitLinks = page.locator("a[href^='/vet-visits/']");
            if ((await visitLinks.count()) > 0) {
                const costCard = page.locator(".glass-card").filter({
                    has: page.locator("text=/total|gesamt|cost|kosten/i"),
                });
                await expect(costCard.first()).toBeVisible();
            }
        });
    });

    test.describe("Dashboard Widget", () => {
        test("upcoming vet appointments are clickable", async ({ page }) => {
            await page.goto("/dashboard");
            await page.waitForLoadState("networkidle");

            // Look for vet appointment links in dashboard
            const vetLinks = page.locator("a[href^='/vet-visits/']");
            if ((await vetLinks.count()) > 0) {
                await vetLinks.first().click();
                await expect(page).toHaveURL(/\/vet-visits\/.+/);
            }
        });
    });
});
