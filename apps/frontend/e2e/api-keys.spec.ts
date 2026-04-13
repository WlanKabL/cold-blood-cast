import { test, expect } from "@playwright/test";
import { mockAuth } from "./helpers/mock-auth";
import { mockGet, mockMutation } from "./helpers/mock-api";
import { mockApiKeys } from "./helpers/fixtures";

test.describe("API Keys — List Page", () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/api-keys", mockApiKeys);
    });

    test("loads and displays API keys", async ({ page }) => {
        await page.goto("/api-keys");

        await expect(page.locator("h1")).toContainText(/api.key|api.schlüssel/i, {
            timeout: 15_000,
        });
        await expect(
            page.locator("text=Home Assistant").locator("visible=true").first(),
        ).toBeVisible();
        await expect(
            page.locator("text=Grafana Dashboard").locator("visible=true").first(),
        ).toBeVisible();
    });

    test("shows key prefix", async ({ page }) => {
        await page.goto("/api-keys");

        await expect(page.getByText("cbc_abc12").first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows scopes", async ({ page }) => {
        await page.goto("/api-keys");

        await expect(page.getByText(/sensors:read/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test("shows create button", async ({ page }) => {
        await page.goto("/api-keys");

        const createBtn = page.getByRole("button", {
            name: /new api key|api.key|create|erstellen|new|neu/i,
        });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });
    });

    test("opens create modal", async ({ page }) => {
        await page.goto("/api-keys");
        await page.waitForLoadState("networkidle");

        const createBtn = page.getByRole("button", {
            name: /new api key|api.key|create|erstellen|new|neu/i,
        });
        await createBtn.click();

        await expect(
            page.getByRole("heading", { name: /new api key|neuer api.schlüssel/i }),
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe("API Keys — Empty State", () => {
    test("shows empty state when no keys", async ({ page }) => {
        await mockAuth(page);
        await mockGet(page, "/api/api-keys", []);

        await page.goto("/api-keys");

        await expect(page.getByText(/no api key|kein api.schlüssel|empty/i).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
