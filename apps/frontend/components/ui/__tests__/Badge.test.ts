import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Badge from "../Badge.vue";

describe("UiBadge", () => {
    it("renders slot content", () => {
        const wrapper = mount(Badge, { slots: { default: "Active" } });
        expect(wrapper.text()).toBe("Active");
    });

    it("applies default color (zinc) classes", () => {
        const wrapper = mount(Badge, { slots: { default: "Default" } });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-zinc-500/10");
        expect(el.classes()).toContain("text-zinc-400");
    });

    it("applies emerald color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "emerald" },
            slots: { default: "Success" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-emerald-500/10");
        expect(el.classes()).toContain("text-emerald-400");
    });

    it("applies amber color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "amber" },
            slots: { default: "Warning" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-amber-500/10");
        expect(el.classes()).toContain("text-amber-400");
    });

    it("applies primary color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "primary" },
            slots: { default: "Primary" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-primary-500/10");
        expect(el.classes()).toContain("text-primary-400");
    });

    it("applies violet color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "violet" },
            slots: { default: "Imported" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-violet-500/10");
        expect(el.classes()).toContain("text-violet-400");
    });

    it("applies red color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "red" },
            slots: { default: "Error" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-red-500/10");
        expect(el.classes()).toContain("text-red-400");
    });

    it("applies purple color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "purple" },
            slots: { default: "Pro" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-purple-500/10");
        expect(el.classes()).toContain("text-purple-400");
    });

    it("applies blue color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "blue" },
            slots: { default: "Info" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-blue-500/10");
        expect(el.classes()).toContain("text-blue-400");
    });

    it("applies orange color classes", () => {
        const wrapper = mount(Badge, {
            props: { color: "orange" },
            slots: { default: "Note" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("bg-orange-500/10");
        expect(el.classes()).toContain("text-orange-400");
    });

    // ─── Size tests ──────────────────────────────────

    it("applies sm size classes by default", () => {
        const wrapper = mount(Badge, { slots: { default: "Sm" } });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("px-2");
        expect(el.classes()).toContain("py-0.5");
        expect(el.classes()).toContain("text-[10px]");
    });

    it("applies md size classes", () => {
        const wrapper = mount(Badge, {
            props: { size: "md" },
            slots: { default: "Md" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("px-2.5");
        expect(el.classes()).toContain("py-0.5");
        expect(el.classes()).toContain("text-[11px]");
    });

    it("applies lg size classes", () => {
        const wrapper = mount(Badge, {
            props: { size: "lg" },
            slots: { default: "Lg" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("px-3");
        expect(el.classes()).toContain("py-1");
        expect(el.classes()).toContain("text-[12px]");
    });

    // ─── Feature tests ───────────────────────────────

    it("does not render dot by default", () => {
        const wrapper = mount(Badge, { slots: { default: "No dot" } });
        const dots = wrapper.findAll("span > span.rounded-full");
        expect(dots.length).toBe(0);
    });

    it("renders dot when dot prop is true", () => {
        const wrapper = mount(Badge, {
            props: { dot: true, color: "emerald" },
            slots: { default: "With dot" },
        });
        const dot = wrapper.find("span > span.rounded-full");
        expect(dot.exists()).toBe(true);
        expect(dot.classes()).toContain("bg-emerald-400");
    });

    it("dot size changes with badge size", () => {
        const sm = mount(Badge, {
            props: { dot: true, size: "sm" },
            slots: { default: "Sm" },
        });
        const md = mount(Badge, {
            props: { dot: true, size: "md" },
            slots: { default: "Md" },
        });

        const smDot = sm.find("span > span.rounded-full");
        const mdDot = md.find("span > span.rounded-full");

        expect(smDot.classes()).toContain("h-1.5");
        expect(mdDot.classes()).toContain("h-2");
    });

    it("renders with uppercase tracking when uppercase prop is true", () => {
        const wrapper = mount(Badge, {
            props: { uppercase: true },
            slots: { default: "ACTIVE" },
        });
        const el = wrapper.find("span");
        expect(el.classes()).toContain("uppercase");
        expect(el.classes()).toContain("tracking-wider");
    });

    it("does not apply uppercase by default", () => {
        const wrapper = mount(Badge, { slots: { default: "active" } });
        const el = wrapper.find("span");
        expect(el.classes()).not.toContain("uppercase");
    });

    it("always has rounded-full class", () => {
        const wrapper = mount(Badge, { slots: { default: "Round" } });
        expect(wrapper.find("span").classes()).toContain("rounded-full");
    });

    it("always has inline-flex and font-medium", () => {
        const wrapper = mount(Badge, { slots: { default: "Flex" } });
        const classes = wrapper.find("span").classes();
        expect(classes).toContain("inline-flex");
        expect(classes).toContain("font-medium");
    });
});
