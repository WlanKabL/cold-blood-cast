import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Textarea from "../Textarea.vue";

describe("UiTextarea", () => {
    it("renders a textarea element", () => {
        const wrapper = mount(Textarea);
        expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("renders label when provided", () => {
        const wrapper = mount(Textarea, { props: { label: "Notes" } });
        expect(wrapper.find("label").text()).toBe("Notes");
    });

    it("does not render label when omitted", () => {
        const wrapper = mount(Textarea);
        expect(wrapper.find("label").exists()).toBe(false);
    });

    it("emits update:modelValue on input", async () => {
        const wrapper = mount(Textarea, { props: { modelValue: "" } });
        await wrapper.find("textarea").setValue("some text");
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    });

    it("applies rows attribute", () => {
        const wrapper = mount(Textarea, { props: { rows: 5 } });
        expect(wrapper.find("textarea").attributes("rows")).toBe("5");
    });

    it("renders hint text", () => {
        const wrapper = mount(Textarea, { props: { hint: "Optional" } });
        expect(wrapper.text()).toContain("Optional");
    });

    it("renders error text", () => {
        const wrapper = mount(Textarea, { props: { error: "Too short" } });
        expect(wrapper.text()).toContain("Too short");
    });

    it("applies disabled attribute", () => {
        const wrapper = mount(Textarea, { props: { disabled: true } });
        expect(wrapper.find("textarea").attributes("disabled")).toBeDefined();
    });
});
