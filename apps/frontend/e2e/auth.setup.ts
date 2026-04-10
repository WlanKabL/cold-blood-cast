import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? "test@coldbloodcast.local");
    await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD ?? "Test1234!");
    await page.getByRole("button", { name: /log\s*in|anmelden|sign\s*in/i }).click();

    // Wait for redirect to dashboard after login
    await expect(page).toHaveURL(/\/(dashboard)?$/);

    await page.context().storageState({ path: authFile });
});
