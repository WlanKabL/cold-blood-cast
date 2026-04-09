import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import AppTopbar from "../AppTopbar.vue";

// ─── Mocks ───────────────────────────────────────────────────

const mockRoute = { path: "/dashboard" };
vi.stubGlobal("useRoute", () => mockRoute);

vi.stubGlobal("useI18n", () => ({ t: (key: string) => key }));

const mockSettings = {
    currentLocale: "en",
    isDarkMode: true,
    toggleTheme: vi.fn(),
    setLocale: vi.fn(),
};
vi.stubGlobal("useSettingsStore", () => mockSettings);

const stubs = { Icon: true, NuxtLink: { template: "<a><slot /></a>", props: ["to"] } };
const mocks = { $t: (key: string) => key };

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.path = "/dashboard";
    mockSettings.currentLocale = "en";
});

describe("AppTopbar", () => {
    it("renders page title for known route", () => {
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("nav.dashboard");
    });

    it("falls back to KeeperLog for unknown route", () => {
        mockRoute.path = "/unknown-page";
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("KeeperLog");
    });

    it("shows enclosures title for /enclosures route", () => {
        mockRoute.path = "/enclosures";
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("nav.enclosures");
    });

    it("shows sensors title for /sensors route", () => {
        mockRoute.path = "/sensors";
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("nav.sensors");
    });

    it("emits toggleSidebar on menu button click", async () => {
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("toggleSidebar")).toBeTruthy();
    });

    it("toggles locale between en and de", async () => {
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        const localeBtn = wrapper.findAll("button").find((b) => b.text() === "EN");
        await localeBtn!.trigger("click");
        expect(mockSettings.setLocale).toHaveBeenCalledWith("de");
    });

    it("calls toggleTheme on theme button click", async () => {
        const wrapper = mount(AppTopbar, { global: { stubs, mocks } });
        const buttons = wrapper.findAll("button");
        const themeBtn = buttons[buttons.length - 1];
        await themeBtn.trigger("click");
        expect(mockSettings.toggleTheme).toHaveBeenCalled();
    });
});
