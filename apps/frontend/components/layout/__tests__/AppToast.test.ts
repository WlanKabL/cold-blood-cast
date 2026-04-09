import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import AppToast from "../AppToast.vue";

// ─── Mock useToast ───────────────────────────────────────────

const mockRemove = vi.fn();
const mockToasts = ref<Array<{ id: string; title: string; description?: string; color: string }>>(
    [],
);

vi.stubGlobal("useToast", () => ({
    toasts: mockToasts,
    remove: mockRemove,
}));

const stubs = { Icon: true, Teleport: true };

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    mockToasts.value = [];
    mockRemove.mockClear();
});

describe("AppToast", () => {
    it("renders nothing when there are no toasts", () => {
        const wrapper = mount(AppToast, { global: { stubs } });
        expect(wrapper.findAll("[role='status']")).toHaveLength(0);
    });

    it("renders a toast for each item in toasts", () => {
        mockToasts.value = [
            { id: "1", title: "Success", color: "green" },
            { id: "2", title: "Error", color: "red" },
        ];
        const wrapper = mount(AppToast, { global: { stubs } });
        expect(wrapper.findAll("[role='status']")).toHaveLength(2);
    });

    it("displays toast title", () => {
        mockToasts.value = [{ id: "1", title: "Sensor added", color: "green" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        expect(wrapper.text()).toContain("Sensor added");
    });

    it("displays description when provided", () => {
        mockToasts.value = [
            { id: "1", title: "Error", description: "Something went wrong", color: "red" },
        ];
        const wrapper = mount(AppToast, { global: { stubs } });
        expect(wrapper.text()).toContain("Something went wrong");
    });

    it("hides description when not provided", () => {
        mockToasts.value = [{ id: "1", title: "Info", color: "blue" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const paragraphs = wrapper.findAll("p");
        // Only title paragraph, no description paragraph
        expect(paragraphs).toHaveLength(1);
    });

    it("applies correct CSS classes for green toast", () => {
        mockToasts.value = [{ id: "1", title: "OK", color: "green" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const toast = wrapper.find("[role='status']");
        expect(toast.classes()).toContain("border-green-500/30");
    });

    it("applies correct CSS classes for red toast", () => {
        mockToasts.value = [{ id: "1", title: "Fail", color: "red" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const toast = wrapper.find("[role='status']");
        expect(toast.classes()).toContain("border-red-500/30");
    });

    it("applies correct CSS classes for amber toast", () => {
        mockToasts.value = [{ id: "1", title: "Warn", color: "amber" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const toast = wrapper.find("[role='status']");
        expect(toast.classes()).toContain("border-amber-500/30");
    });

    it("falls back to blue styling for unknown color", () => {
        mockToasts.value = [{ id: "1", title: "Custom", color: "purple" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const toast = wrapper.find("[role='status']");
        expect(toast.classes()).toContain("border-primary-500/30");
    });

    it("calls remove when close button is clicked", async () => {
        mockToasts.value = [{ id: "toast-1", title: "Test", color: "blue" }];
        const wrapper = mount(AppToast, { global: { stubs } });
        const closeBtn = wrapper.find("button");
        await closeBtn.trigger("click");
        expect(mockRemove).toHaveBeenCalledWith("toast-1");
    });

    it("has aria-live polite for accessibility", () => {
        const wrapper = mount(AppToast, { global: { stubs } });
        const container = wrapper.find("[aria-live]");
        expect(container.attributes("aria-live")).toBe("polite");
    });
});
