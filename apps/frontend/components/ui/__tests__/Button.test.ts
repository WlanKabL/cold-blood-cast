import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "../Button.vue";

describe("UiButton", () => {
    it("renders as a button by default", () => {
        const wrapper = mount(Button, { slots: { default: "Click me" } });
        const btn = wrapper.find("button");
        expect(btn.exists()).toBe(true);
        expect(btn.text()).toBe("Click me");
        expect(btn.attributes("type")).toBe("button");
    });

    it("renders with submit type", () => {
        const wrapper = mount(Button, { props: { type: "submit" }, slots: { default: "Go" } });
        expect(wrapper.find("button").attributes("type")).toBe("submit");
    });

    it("applies primary variant classes by default", () => {
        const wrapper = mount(Button, { slots: { default: "Primary" } });
        expect(wrapper.find("button").classes()).toContain("from-primary-500");
    });

    it("applies secondary variant classes", () => {
        const wrapper = mount(Button, {
            props: { variant: "secondary" },
            slots: { default: "Secondary" },
        });
        const classes = wrapper.find("button").classes();
        expect(classes).toContain("border");
        expect(classes).toContain("border-line");
    });

    it("applies danger variant classes", () => {
        const wrapper = mount(Button, {
            props: { variant: "danger" },
            slots: { default: "Delete" },
        });
        expect(wrapper.find("button").classes()).toContain("bg-red-500");
    });

    it("applies ghost variant classes", () => {
        const wrapper = mount(Button, {
            props: { variant: "ghost" },
            slots: { default: "Ghost" },
        });
        expect(wrapper.find("button").classes()).toContain("text-fg-muted");
    });

    it("applies accent variant classes", () => {
        const wrapper = mount(Button, {
            props: { variant: "accent" },
            slots: { default: "Accent" },
        });
        expect(wrapper.find("button").classes()).toContain("bg-accent");
    });

    it("applies small size classes", () => {
        const wrapper = mount(Button, {
            props: { size: "sm" },
            slots: { default: "Small" },
        });
        const classes = wrapper.find("button").classes();
        expect(classes).toContain("px-3");
        expect(classes).toContain("py-1.5");
    });

    it("applies medium size classes by default", () => {
        const wrapper = mount(Button, { slots: { default: "Medium" } });
        const classes = wrapper.find("button").classes();
        expect(classes).toContain("px-4");
        expect(classes).toContain("py-2.5");
    });

    it("applies large size classes", () => {
        const wrapper = mount(Button, {
            props: { size: "lg" },
            slots: { default: "Large" },
        });
        const classes = wrapper.find("button").classes();
        expect(classes).toContain("px-6");
        expect(classes).toContain("py-3");
    });

    it("is disabled when disabled prop is true", () => {
        const wrapper = mount(Button, {
            props: { disabled: true },
            slots: { default: "Disabled" },
        });
        expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    });

    it("is disabled when loading is true", () => {
        const wrapper = mount(Button, {
            props: { loading: true },
            slots: { default: "Loading..." },
        });
        expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    });

    it("applies full width when block is true", () => {
        const wrapper = mount(Button, {
            props: { block: true },
            slots: { default: "Full Width" },
        });
        expect(wrapper.find("button").classes()).toContain("w-full");
    });

    it("does not apply w-full by default", () => {
        const wrapper = mount(Button, { slots: { default: "Normal" } });
        expect(wrapper.find("button").classes()).not.toContain("w-full");
    });

    it("emits click event", async () => {
        const wrapper = mount(Button, { slots: { default: "Click" } });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("click")).toBeTruthy();
    });

    it("does not emit click when disabled", async () => {
        const wrapper = mount(Button, {
            props: { disabled: true },
            slots: { default: "Can't click" },
        });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("click")).toBeUndefined();
    });
});
