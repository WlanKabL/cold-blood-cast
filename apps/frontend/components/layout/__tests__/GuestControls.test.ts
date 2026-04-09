import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GuestControls from "../GuestControls.vue";

const mockStore = {
    currentLocale: "en",
    isDarkMode: true,
    toggleTheme: vi.fn(),
    setLocale: vi.fn(),
};

vi.stubGlobal("useSettingsStore", () => mockStore);

const stubs = { Icon: true };

describe("GuestControls", () => {
    beforeEach(() => {
        mockStore.currentLocale = "en";
        mockStore.isDarkMode = true;
        mockStore.toggleTheme.mockClear();
        mockStore.setLocale.mockClear();
    });

    it("renders locale and theme toggle buttons", () => {
        const wrapper = mount(GuestControls, { global: { stubs } });
        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(2);
    });

    it("displays current locale in uppercase", () => {
        const wrapper = mount(GuestControls, { global: { stubs } });
        expect(wrapper.text()).toContain("EN");
    });

    it("toggles locale from en to de on click", async () => {
        const wrapper = mount(GuestControls, { global: { stubs } });
        const localeBtn = wrapper.findAll("button")[0];
        await localeBtn.trigger("click");
        expect(mockStore.setLocale).toHaveBeenCalledWith("de");
    });

    it("toggles locale from de to en on click", async () => {
        mockStore.currentLocale = "de";
        const wrapper = mount(GuestControls, { global: { stubs } });
        const localeBtn = wrapper.findAll("button")[0];
        await localeBtn.trigger("click");
        expect(mockStore.setLocale).toHaveBeenCalledWith("en");
    });

    it("calls toggleTheme on theme button click", async () => {
        const wrapper = mount(GuestControls, { global: { stubs } });
        const themeBtn = wrapper.findAll("button")[1];
        await themeBtn.trigger("click");
        expect(mockStore.toggleTheme).toHaveBeenCalled();
    });

    it("applies dark variant styling when variant is dark", () => {
        const wrapper = mount(GuestControls, {
            props: { variant: "dark" },
            global: { stubs },
        });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("text-gray-400");
    });

    it("applies auto variant styling by default", () => {
        const wrapper = mount(GuestControls, {
            global: { stubs },
        });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("text-fg-muted");
    });

    it("is positioned fixed top-right", () => {
        const wrapper = mount(GuestControls, { global: { stubs } });
        const root = wrapper.find("div");
        expect(root.classes()).toContain("fixed");
        expect(root.classes()).toContain("right-4");
        expect(root.classes()).toContain("top-4");
    });
});
