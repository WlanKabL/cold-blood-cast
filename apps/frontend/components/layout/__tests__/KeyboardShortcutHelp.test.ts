import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed } from "vue";
import KeyboardShortcutHelp from "../KeyboardShortcutHelp.vue";

// ─── Mock useKeyboardShortcuts ───────────────────────────────

const mockShowHelp = ref(false);
const mockAllShortcuts = ref<Array<{ key: string; label: string; category: string }>>([]);

vi.stubGlobal("useKeyboardShortcuts", () => ({
    allShortcuts: mockAllShortcuts,
    showHelp: mockShowHelp,
}));

const stubs = { Icon: true, Teleport: true };
const mocks = { $t: (key: string) => key };

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    mockShowHelp.value = false;
    mockAllShortcuts.value = [];
});

describe("KeyboardShortcutHelp", () => {
    it("does not render content when showHelp is false", () => {
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.find("h2").exists()).toBe(false);
    });

    it("renders content when showHelp is true", async () => {
        mockShowHelp.value = true;
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("shortcuts.title");
    });

    it("shows navigation shortcuts section", () => {
        mockShowHelp.value = true;
        mockAllShortcuts.value = [
            { key: "D", label: "shortcuts.dashboard", category: "navigation" },
            { key: "T", label: "shortcuts.trades", category: "navigation" },
        ];
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("shortcuts.navigation");
        expect(wrapper.text()).toContain("shortcuts.dashboard");
        expect(wrapper.text()).toContain("shortcuts.trades");
    });

    it("shows action shortcuts when they exist", () => {
        mockShowHelp.value = true;
        mockAllShortcuts.value = [{ key: "N", label: "shortcuts.newEntry", category: "actions" }];
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("shortcuts.actions");
        expect(wrapper.text()).toContain("shortcuts.newEntry");
    });

    it("hides action section when no action shortcuts exist", () => {
        mockShowHelp.value = true;
        mockAllShortcuts.value = [
            { key: "D", label: "shortcuts.dashboard", category: "navigation" },
        ];
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.text()).not.toContain("shortcuts.actions");
    });

    it("shows general shortcuts section with Esc key", () => {
        mockShowHelp.value = true;
        mockAllShortcuts.value = [{ key: "?", label: "shortcuts.help", category: "general" }];
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        expect(wrapper.text()).toContain("shortcuts.general");
        expect(wrapper.text()).toContain("Esc");
        expect(wrapper.text()).toContain("shortcuts.closeModal");
    });

    it("closes help when close button is clicked", async () => {
        mockShowHelp.value = true;
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        const closeBtn = wrapper.find("button");
        await closeBtn.trigger("click");
        expect(mockShowHelp.value).toBe(false);
    });

    it("closes help when backdrop is clicked", async () => {
        mockShowHelp.value = true;
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        const backdrop = wrapper.find(".fixed.inset-0");
        await backdrop.trigger("mousedown");
        expect(mockShowHelp.value).toBe(false);
    });

    it("renders kbd elements for shortcut keys", () => {
        mockShowHelp.value = true;
        mockAllShortcuts.value = [
            { key: "D", label: "shortcuts.dashboard", category: "navigation" },
        ];
        const wrapper = mount(KeyboardShortcutHelp, { global: { stubs, mocks } });
        const kbds = wrapper.findAll("kbd");
        // One for "D" from nav, one for "Esc" hardcoded
        expect(kbds.length).toBeGreaterThanOrEqual(2);
        expect(kbds.some((k) => k.text() === "D")).toBe(true);
        expect(kbds.some((k) => k.text() === "Esc")).toBe(true);
    });
});
