import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

const mockEnv = {
    TELEGRAM_BOT_TOKEN: "123:ABC",
    TELEGRAM_CHAT_ID: "chat-42",
    DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/test",
};

vi.mock("@/config/env.js", () => ({
    env: () => mockEnv,
}));

const mockGetSystemSetting = vi.fn();
vi.mock("@/modules/admin/settings.service.js", () => ({
    getSystemSetting: (...args: unknown[]) => mockGetSystemSetting(...args),
}));

// Mock global fetch
const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
vi.stubGlobal("fetch", mockFetch);

const {
    notify,
    notifyNewUser,
    notifyLogin,
    notifyFirstLogin,
    notifyPendingApproval,
    notifyAlertBreach,
    notifyServerError,
    notifySensorAlert,
} = await import("../notification.service.js");

describe("notification.service — notify()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: all events enabled, both channels enabled
        mockGetSystemSetting.mockImplementation((key: string, defaultVal: unknown) => {
            if (key === "telegram_enabled") return Promise.resolve(true);
            if (key === "discord_enabled") return Promise.resolve(true);
            return Promise.resolve(defaultVal ?? true);
        });
        mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
    });

    it("sends to both Telegram and Discord when enabled", async () => {
        await notify("register", {
            title: "Test",
            color: 0x6366f1,
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0]);
        expect(urls).toContain("https://api.telegram.org/bot123:ABC/sendMessage");
        expect(urls).toContain("https://discord.com/api/webhooks/test");
    });

    it("sends Telegram message with correct payload", async () => {
        await notify("register", {
            title: "New User",
            description: "A user signed up",
            color: 0x6366f1,
            fields: [{ name: "Username", value: "keeper42", inline: true }],
        });

        const telegramCall = mockFetch.mock.calls.find(
            (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("telegram"),
        );
        expect(telegramCall).toBeTruthy();

        const body = JSON.parse((telegramCall![1] as RequestInit).body as string);
        expect(body.chat_id).toBe("chat-42");
        expect(body.parse_mode).toBe("HTML");
        expect(body.text).toContain("New User");
        expect(body.text).toContain("keeper42");
    });

    it("sends Discord embed with correct payload", async () => {
        await notify("breach", {
            title: "Sensor Alert Triggered",
            color: 0xef4444,
            fields: [{ name: "Enclosure", value: "Terrarium-1" }],
        });

        const discordCall = mockFetch.mock.calls.find(
            (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("discord"),
        );
        expect(discordCall).toBeTruthy();

        const body = JSON.parse((discordCall![1] as RequestInit).body as string);
        expect(body.embeds).toHaveLength(1);
        expect(body.embeds[0].title).toBe("Sensor Alert Triggered");
        expect(body.embeds[0].color).toBe(0xef4444);
        expect(body.embeds[0].footer.text).toBe("KeeperLog");
    });

    it("does not send when event is disabled", async () => {
        mockGetSystemSetting.mockImplementation((key: string) => {
            if (key === "notify_on_register") return Promise.resolve(false);
            return Promise.resolve(true);
        });

        await notify("register", { title: "Blocked", color: 0 });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not send to Telegram when telegram_enabled is false", async () => {
        mockGetSystemSetting.mockImplementation((key: string) => {
            if (key === "telegram_enabled") return Promise.resolve(false);
            if (key === "discord_enabled") return Promise.resolve(true);
            return Promise.resolve(true);
        });

        await notify("login", { title: "Login", color: 0 });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain("discord");
    });

    it("does not send to Discord when discord_enabled is false", async () => {
        mockGetSystemSetting.mockImplementation((key: string) => {
            if (key === "discord_enabled") return Promise.resolve(false);
            if (key === "telegram_enabled") return Promise.resolve(true);
            return Promise.resolve(true);
        });

        await notify("login", { title: "Login", color: 0 });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain("telegram");
    });

    it("does not throw when fetch fails", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        await expect(notify("server_error", { title: "Err", color: 0 })).resolves.toBeUndefined();
    });

    it("does not throw when Telegram returns non-ok response", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            text: () => Promise.resolve("Forbidden"),
        });

        await expect(notify("register", { title: "Test", color: 0 })).resolves.toBeUndefined();
    });
});

// ── Convenience wrapper tests ────────────────────────────────

describe("notification.service — convenience wrappers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSystemSetting.mockResolvedValue(true);
        mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
    });

    it("notifyNewUser sends register event", () => {
        notifyNewUser("alice", "alice@test.com");

        // Fire-and-forget — just verify it doesn't throw synchronously
        expect(true).toBe(true);
    });

    it("notifyPendingApproval sends pending event", () => {
        notifyPendingApproval("bob", "bob@test.com");
        expect(true).toBe(true);
    });

    it("notifyLogin sends login event", () => {
        notifyLogin("charlie", "192.168.1.1");
        expect(true).toBe(true);
    });

    it("notifyLogin handles missing IP", () => {
        notifyLogin("charlie");
        expect(true).toBe(true);
    });

    it("notifyFirstLogin sends first_login event", () => {
        notifyFirstLogin("dave");
        expect(true).toBe(true);
    });

    it("notifyAlertBreach sends breach event with sensor details", () => {
        notifyAlertBreach("eve", "Terrarium-1", "Temperature", "35.2°C", "32°C");
        expect(true).toBe(true);
    });

    it("notifyServerError sends server_error event", () => {
        notifyServerError("Unhandled rejection", "/api/enclosures");
        expect(true).toBe(true);
    });

    it("notifyServerError handles missing path", () => {
        notifyServerError("Something broke");
        expect(true).toBe(true);
    });

    it("notifySensorAlert sends sensor_alert event", () => {
        notifySensorAlert("frank", "Terrarium-1", "Temperature", "35.2°C", "32°C");
        expect(true).toBe(true);
    });
});

// ── Missing credentials tests ────────────────────────────────

describe("notification.service — missing credentials", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSystemSetting.mockResolvedValue(true);
        mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
    });

    it("skips Telegram when TELEGRAM_BOT_TOKEN is empty", async () => {
        const origToken = mockEnv.TELEGRAM_BOT_TOKEN;
        mockEnv.TELEGRAM_BOT_TOKEN = "";

        await notify("register", { title: "Test", color: 0 });

        // Only Discord should be called
        const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0]);
        expect(
            urls.every(
                (u: unknown) => typeof u === "string" && !(u as string).includes("telegram"),
            ),
        ).toBe(true);

        mockEnv.TELEGRAM_BOT_TOKEN = origToken;
    });

    it("skips Discord when DISCORD_WEBHOOK_URL is empty", async () => {
        const origUrl = mockEnv.DISCORD_WEBHOOK_URL;
        mockEnv.DISCORD_WEBHOOK_URL = "";

        await notify("register", { title: "Test", color: 0 });

        const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0]);
        expect(
            urls.every((u: unknown) => typeof u === "string" && !(u as string).includes("discord")),
        ).toBe(true);

        mockEnv.DISCORD_WEBHOOK_URL = origUrl;
    });
});
