import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Toggle from "../Toggle.vue";

describe("UiToggle", () => {
    it("renders a button element", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false } });
        expect(wrapper.find("button").exists()).toBe(true);
    });

    it("applies inactive styling when modelValue is false", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false } });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("bg-line");
    });

    it("applies active styling when modelValue is true", () => {
        const wrapper = mount(Toggle, { props: { modelValue: true } });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("bg-primary-500");
    });

    it("emits update:modelValue with true when clicked while off", async () => {
        const wrapper = mount(Toggle, { props: { modelValue: false } });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
    });

    it("emits update:modelValue with false when clicked while on", async () => {
        const wrapper = mount(Toggle, { props: { modelValue: true } });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
    });

    it("does not emit when disabled", async () => {
        const wrapper = mount(Toggle, { props: { modelValue: false, disabled: true } });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("applies disabled attribute when disabled", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false, disabled: true } });
        expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    });

    it("uses emerald color when specified", () => {
        const wrapper = mount(Toggle, { props: { modelValue: true, color: "emerald" } });
        expect(wrapper.find("button").classes()).toContain("bg-emerald-500");
    });

    it("uses red color when specified", () => {
        const wrapper = mount(Toggle, { props: { modelValue: true, color: "red" } });
        expect(wrapper.find("button").classes()).toContain("bg-red-500");
    });

    it("uses small size classes when size is sm", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false, size: "sm" } });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("h-4");
        expect(btn.classes()).toContain("w-7");
    });

    it("uses medium size classes by default", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false } });
        const btn = wrapper.find("button");
        expect(btn.classes()).toContain("h-5");
        expect(btn.classes()).toContain("w-9");
    });

    it("moves thumb to active position when on", () => {
        const wrapper = mount(Toggle, { props: { modelValue: true } });
        const thumb = wrapper.find("span");
        expect(thumb.classes()).toContain("left-4.5");
    });

    it("moves thumb to inactive position when off", () => {
        const wrapper = mount(Toggle, { props: { modelValue: false } });
        const thumb = wrapper.find("span");
        expect(thumb.classes()).toContain("left-0.5");
    });
});
