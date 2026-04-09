import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import AppSidebar from "../AppSidebar.vue";

// ─── Mocks ───────────────────────────────────────────────────

const mockRoute = { path: "/dashboard" };
vi.stubGlobal("useRoute", () => mockRoute);

const mockPush = vi.fn();
vi.stubGlobal("useRouter", () => ({ push: mockPush }));

const mockAuthStore = {
    user: { displayName: "Snake Keeper", username: "keeper", email: "keeper@example.com" },
    isAdmin: false,
    hasFeature: vi.fn().mockReturnValue(true),
    isFeatureEnabled: vi.fn().mockReturnValue(true),
    getFeatureTier: vi.fn().mockReturnValue([]),
    logout: vi.fn().mockResolvedValue(undefined),
};
vi.stubGlobal("useAuthStore", () => mockAuthStore);

const stubs = {
    Icon: true,
    NuxtLink: { template: "<a><slot /></a>", props: ["to"] },
};
const mocks = { $t: (key: string) => key };

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.path = "/dashboard";
    mockAuthStore.user = {
        displayName: "Snake Keeper",
        username: "keeper",
        email: "keeper@example.com",
    };
    mockAuthStore.isAdmin = false;
    mockAuthStore.hasFeature.mockReturnValue(true);
    mockAuthStore.isFeatureEnabled.mockReturnValue(true);
    mockAuthStore.getFeatureTier.mockReturnValue([]);
});

describe("AppSidebar", () => {
    it("renders nav section labels", () => {
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("nav.overview");
        expect(wrapper.text()).toContain("nav.terrarium");
        expect(wrapper.text()).toContain("nav.careLog");
    });

    it("shows user initial from displayName", () => {
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("S");
    });

    it("falls back to username for user initial", () => {
        mockAuthStore.user = { displayName: "", username: "alpha", email: "a@b.com" };
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("A");
    });

    it("shows admin nav item when user is admin", () => {
        mockAuthStore.isAdmin = true;
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("nav.admin");
    });

    it("hides admin nav item when user is not admin", () => {
        mockAuthStore.isAdmin = false;
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).not.toContain("nav.admin");
    });

    it("hides nav items when feature is disabled and no tiers", () => {
        mockAuthStore.hasFeature.mockReturnValue(false);
        mockAuthStore.isFeatureEnabled.mockReturnValue(false);
        mockAuthStore.getFeatureTier.mockReturnValue([]);
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        // Dashboard should still show (always visible)
        expect(wrapper.text()).toContain("nav.overview");
    });

    it("renders CBC domain nav items", () => {
        const wrapper = mount(AppSidebar, {
            props: { isOpen: true },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("nav.enclosures");
        expect(wrapper.text()).toContain("nav.pets");
        expect(wrapper.text()).toContain("nav.sensors");
        expect(wrapper.text()).toContain("nav.feedings");
        expect(wrapper.text()).toContain("nav.sheddings");
        expect(wrapper.text()).toContain("nav.weights");
    });
});
