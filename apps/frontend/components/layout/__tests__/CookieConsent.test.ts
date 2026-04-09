import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import CookieConsent from "../CookieConsent.vue";

const STORAGE_KEY = "kl_cookie_consent";

const mockApi = {
    post: vi.fn().mockResolvedValue({}),
};
vi.stubGlobal("useApi", () => mockApi);

const mockAuthStore = {
    isAuthenticated: false,
};
vi.stubGlobal("useAuthStore", () => mockAuthStore);

const stubs = {
    Icon: true,
    NuxtLink: {
        template: '<a :href="to"><slot /></a>',
        props: ["to"],
    },
    UiToggle: {
        template:
            '<button class="toggle-stub" @click="$emit(\'update:modelValue\', !modelValue)"></button>',
        props: ["modelValue"],
        emits: ["update:modelValue"],
    },
};

const mocks = { $t: (key: string) => key };

async function mountConsent() {
    const wrapper = mount(CookieConsent, { global: { stubs, mocks } });
    await nextTick();
    return wrapper;
}

describe("CookieConsent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockAuthStore.isAuthenticated = false;
    });

    it("shows banner when no consent in localStorage", async () => {
        const wrapper = await mountConsent();
        expect(wrapper.text()).toContain("cookie.message");
    });

    it("hides banner when valid consent exists in localStorage", async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                necessary: true,
                analytics: false,
                timestamp: Date.now(),
                version: 1,
            }),
        );
        const wrapper = await mountConsent();
        expect(wrapper.text()).not.toContain("cookie.message");
    });

    it("shows banner when stored consent has outdated version", async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                necessary: true,
                analytics: false,
                timestamp: Date.now(),
                version: 0,
            }),
        );
        const wrapper = await mountConsent();
        expect(wrapper.text()).toContain("cookie.message");
    });

    it("shows banner when localStorage has malformed JSON", async () => {
        localStorage.setItem(STORAGE_KEY, "not-json");
        const wrapper = await mountConsent();
        expect(wrapper.text()).toContain("cookie.message");
    });

    it("renders learn more link to cookie policy", async () => {
        const wrapper = await mountConsent();
        const link = wrapper.find("a[href='/legal/cookie_policy']");
        expect(link.exists()).toBe(true);
        expect(link.text()).toContain("cookie.learnMore");
    });

    it("renders settings, necessary-only, and accept-all buttons", async () => {
        const wrapper = await mountConsent();
        expect(wrapper.text()).toContain("cookie.settings");
        expect(wrapper.text()).toContain("cookie.onlyNecessary");
        expect(wrapper.text()).toContain("cookie.acceptAll");
    });

    it("hides banner and saves consent on Accept All", async () => {
        const wrapper = await mountConsent();
        const buttons = wrapper.findAll("button");
        const acceptAllBtn = buttons.find((b) => b.text().includes("cookie.acceptAll"));
        await acceptAllBtn!.trigger("click");
        await nextTick();

        // Banner should be hidden
        expect(wrapper.text()).not.toContain("cookie.message");

        // localStorage should have consent with analytics: true
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.necessary).toBe(true);
        expect(stored.analytics).toBe(true);
        expect(stored.version).toBe(1);
    });

    it("hides banner and saves consent on Only Necessary", async () => {
        const wrapper = await mountConsent();
        const buttons = wrapper.findAll("button");
        const necessaryBtn = buttons.find((b) => b.text().includes("cookie.onlyNecessary"));
        await necessaryBtn!.trigger("click");
        await nextTick();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.analytics).toBe(false);
    });

    it("toggles settings panel visibility", async () => {
        const wrapper = await mountConsent();
        const buttons = wrapper.findAll("button");
        const settingsBtn = buttons.find((b) => b.text().includes("cookie.settings"));

        // Initially hidden
        expect(wrapper.text()).not.toContain("cookie.necessary");

        await settingsBtn!.trigger("click");
        await nextTick();

        // Now visible
        expect(wrapper.text()).toContain("cookie.necessary");
        expect(wrapper.text()).toContain("cookie.analytics");
        expect(wrapper.text()).toContain("cookie.alwaysOn");
    });

    it("saves analytics preference from toggle in settings", async () => {
        const wrapper = await mountConsent();

        // Open settings
        const settingsBtn = wrapper
            .findAll("button")
            .find((b) => b.text().includes("cookie.settings"));
        await settingsBtn!.trigger("click");
        await nextTick();

        // Toggle analytics ON (find the toggle stub)
        const toggleBtn = wrapper.find(".toggle-stub");
        await toggleBtn!.trigger("click");
        await nextTick();

        // Save preferences
        const saveBtn = wrapper
            .findAll("button")
            .find((b) => b.text().includes("cookie.savePreferences"));
        await saveBtn!.trigger("click");
        await nextTick();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.analytics).toBe(true);
    });

    it("syncs to backend when authenticated user accepts", async () => {
        mockAuthStore.isAuthenticated = true;
        const wrapper = await mountConsent();

        const acceptAllBtn = wrapper
            .findAll("button")
            .find((b) => b.text().includes("cookie.acceptAll"));
        await acceptAllBtn!.trigger("click");
        await flushPromises();

        expect(mockApi.post).toHaveBeenCalledWith("/api/users/me/cookie-consent", {
            analytics: true,
            version: 1,
        });
    });

    it("does not sync to backend when unauthenticated user accepts", async () => {
        mockAuthStore.isAuthenticated = false;
        const wrapper = await mountConsent();

        const acceptAllBtn = wrapper
            .findAll("button")
            .find((b) => b.text().includes("cookie.acceptAll"));
        await acceptAllBtn!.trigger("click");
        await flushPromises();

        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it("reads analytics state from stored consent", async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ necessary: true, analytics: true, timestamp: Date.now(), version: 1 }),
        );
        const wrapper = await mountConsent();
        // Banner is hidden because valid consent exists
        expect(wrapper.text()).not.toContain("cookie.message");
    });

    it("saves timestamp in consent data", async () => {
        const before = Date.now();
        const wrapper = await mountConsent();
        const acceptBtn = wrapper
            .findAll("button")
            .find((b) => b.text().includes("cookie.acceptAll"));
        await acceptBtn!.trigger("click");
        const after = Date.now();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.timestamp).toBeGreaterThanOrEqual(before);
        expect(stored.timestamp).toBeLessThanOrEqual(after);
    });
});
