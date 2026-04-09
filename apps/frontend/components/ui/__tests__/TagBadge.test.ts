import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TagBadge from "../TagBadge.vue";

describe("UiTagBadge", () => {
    it("renders tag name", () => {
        const wrapper = mount(TagBadge, { props: { name: "scalping" } });
        expect(wrapper.text()).toContain("scalping");
    });

    it("renders color dot when color prop is set", () => {
        const wrapper = mount(TagBadge, {
            props: { name: "news", color: "#ff0000" },
        });
        const dot = wrapper.find("span[style]");
        expect(dot.exists()).toBe(true);
        expect(dot.attributes("style")).toContain("#ff0000");
    });

    it("does not render color dot when no color", () => {
        const wrapper = mount(TagBadge, { props: { name: "breakout" } });
        const dot = wrapper.find("span[style]");
        expect(dot.exists()).toBe(false);
    });

    it("renders remove button when removable", () => {
        const wrapper = mount(TagBadge, {
            props: { name: "test", removable: true },
        });
        expect(wrapper.find("button").exists()).toBe(true);
    });

    it("does not render remove button by default", () => {
        const wrapper = mount(TagBadge, { props: { name: "test" } });
        expect(wrapper.find("button").exists()).toBe(false);
    });

    it("emits remove event on button click", async () => {
        const wrapper = mount(TagBadge, {
            props: { name: "old-tag", removable: true },
        });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("remove")).toBeTruthy();
    });

    it("applies sm size classes", () => {
        const wrapper = mount(TagBadge, {
            props: { name: "tag", size: "sm" },
        });
        expect(wrapper.find("span").classes()).toContain("text-[10px]");
    });

    it("applies md size classes by default", () => {
        const wrapper = mount(TagBadge, { props: { name: "tag" } });
        expect(wrapper.find("span").classes()).toContain("text-[11px]");
    });
});
