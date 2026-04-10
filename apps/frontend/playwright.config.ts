import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "github" : "list",

    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        { name: "setup", testMatch: /.*\.setup\.ts/ },
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                storageState: "e2e/.auth/user.json",
            },
            dependencies: ["setup"],
        },
    ],

    webServer: [
        {
            command: "pnpm dev:backend",
            port: 3001,
            reuseExistingServer: !process.env.CI,
            cwd: "..",
        },
        {
            command: "pnpm dev:frontend",
            port: 3000,
            reuseExistingServer: !process.env.CI,
            cwd: "..",
        },
    ],
});
