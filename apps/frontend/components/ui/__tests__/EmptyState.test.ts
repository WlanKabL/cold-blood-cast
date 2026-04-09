import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EmptyState from "../EmptyState.vue";

describe("UiEmptyState", () => {
    it("renders title text", () => {
        const wrapper = mount(EmptyState, { props: { title: "No data yet" } });
        expect(wrapper.text()).toContain("No data yet");
    });

    it("renders description text", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", description: "Add your first entry" },
        });
        expect(wrapper.text()).toContain("Add your first entry");
    });

    it("does not render description when not provided", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        const paragraphs = wrapper.findAll("p");
        expect(paragraphs.length).toBe(1);
    });

    it("does not render title when not provided", () => {
        const wrapper = mount(EmptyState, { props: { description: "Hint text" } });
        const paragraphs = wrapper.findAll("p");
        expect(paragraphs.length).toBe(1);
        expect(paragraphs[0].classes()).toContain("text-fg-faint");
    });

    // ─── Container classes ───────────────────────────

    it("has dashed border", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        const container = wrapper.find("div");
        expect(container.classes()).toContain("border-dashed");
        expect(container.classes()).toContain("border-line");
    });

    it("has centered flex layout", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        const container = wrapper.find("div");
        expect(container.classes()).toContain("flex");
        expect(container.classes()).toContain("flex-col");
        expect(container.classes()).toContain("items-center");
        expect(container.classes()).toContain("justify-center");
    });

    it("has rounded-2xl", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        expect(wrapper.find("div").classes()).toContain("rounded-2xl");
    });

    // ─── Icon rendering ──────────────────────────────

    it("does not render icon container when icon is not provided", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        // Icon container has both flex and rounded-2xl — the outer container has flex-col
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        // Filter out the outer container which also matches (it has flex-col)
        const innerOnly = iconContainers.filter((el) => !el.classes().includes("flex-col"));
        expect(innerOnly.length).toBe(0);
    });

    it("renders icon container with primary color by default", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:inbox" },
        });
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const iconContainer = iconContainers.find((el) => !el.classes().includes("flex-col"));
        expect(iconContainer).toBeTruthy();
        expect(iconContainer!.classes()).toContain("bg-primary-500/10");
    });

    it("renders icon container with purple color", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:trophy", iconColor: "purple" },
        });
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const iconContainer = iconContainers.find((el) => !el.classes().includes("flex-col"));
        expect(iconContainer!.classes()).toContain("bg-purple-500/10");
    });

    it("renders icon container with amber color", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:alert-circle", iconColor: "amber" },
        });
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const iconContainer = iconContainers.find((el) => !el.classes().includes("flex-col"));
        expect(iconContainer!.classes()).toContain("bg-amber-500/10");
    });

    it("renders icon container with emerald color", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:check", iconColor: "emerald" },
        });
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const iconContainer = iconContainers.find((el) => !el.classes().includes("flex-col"));
        expect(iconContainer!.classes()).toContain("bg-emerald-500/10");
    });

    it("renders icon container with zinc color (uses bg-surface-raised)", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:tag", iconColor: "zinc" },
        });
        const iconContainers = wrapper.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const iconContainer = iconContainers.find((el) => !el.classes().includes("flex-col"));
        expect(iconContainer!.classes()).toContain("bg-surface-raised");
    });

    // ─── Size variants ───────────────────────────────

    it("applies md padding by default", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty" } });
        const container = wrapper.find("div");
        expect(container.classes()).toContain("py-20");
    });

    it("applies sm padding", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty", size: "sm" } });
        const container = wrapper.find("div");
        expect(container.classes()).toContain("py-10");
    });

    it("applies lg padding", () => {
        const wrapper = mount(EmptyState, { props: { title: "Empty", size: "lg" } });
        const container = wrapper.find("div");
        expect(container.classes()).toContain("py-24");
    });

    it("icon container size changes with size prop", () => {
        const sm = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:inbox", size: "sm" },
        });
        const lg = mount(EmptyState, {
            props: { title: "Empty", icon: "lucide:inbox", size: "lg" },
        });

        const smContainers = sm.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const lgContainers = lg.findAll("div.flex.items-center.justify-center.rounded-2xl");
        const smContainer = smContainers.find((el) => !el.classes().includes("flex-col"));
        const lgContainer = lgContainers.find((el) => !el.classes().includes("flex-col"));

        expect(smContainer!.classes()).toContain("h-10");
        expect(lgContainer!.classes()).toContain("h-16");
    });

    // ─── Slot ────────────────────────────────────────

    it("renders slot content (CTA button)", () => {
        const wrapper = mount(EmptyState, {
            props: { title: "No items" },
            slots: { default: "<button>Add Item</button>" },
        });
        const button = wrapper.find("button");
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe("Add Item");
    });

    it("works without any props or slots", () => {
        const wrapper = mount(EmptyState);
        expect(wrapper.find("div").exists()).toBe(true);
        expect(wrapper.find("div").classes()).toContain("border-dashed");
    });
});
