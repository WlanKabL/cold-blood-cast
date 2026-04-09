import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TextInput from "../TextInput.vue";

describe("UiTextInput", () => {
    it("renders with default props", () => {
        const wrapper = mount(TextInput);
        const input = wrapper.find("input");
        expect(input.exists()).toBe(true);
        expect(input.attributes("type")).toBe("text");
    });

    it("renders label when provided", () => {
        const wrapper = mount(TextInput, { props: { label: "Username" } });
        const label = wrapper.find("label");
        expect(label.exists()).toBe(true);
        expect(label.text()).toBe("Username");
    });

    it("does not render label when omitted", () => {
        const wrapper = mount(TextInput);
        expect(wrapper.find("label").exists()).toBe(false);
    });

    it("renders hint text", () => {
        const wrapper = mount(TextInput, { props: { hint: "Max 50 chars" } });
        const hint = wrapper.findAll("p").find((p) => p.text() === "Max 50 chars");
        expect(hint).toBeDefined();
    });

    it("renders error text with red styling", () => {
        const wrapper = mount(TextInput, { props: { error: "Required" } });
        const error = wrapper.findAll("p").find((p) => p.text() === "Required");
        expect(error).toBeDefined();
        expect(error!.classes()).toContain("text-red-400");
    });

    it("emits update:modelValue on input (text)", async () => {
        const wrapper = mount(TextInput, { props: { modelValue: "" } });
        const input = wrapper.find("input");
        await input.setValue("hello");
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    });

    it("emits number for type=number", async () => {
        const wrapper = mount(TextInput, {
            props: { modelValue: 0, type: "number" },
        });
        const input = wrapper.find("input");
        await input.setValue("42");
        const emitted = wrapper.emitted("update:modelValue");
        expect(emitted).toBeTruthy();
        // valueAsNumber returns a number
        const lastValue = emitted![emitted!.length - 1][0];
        expect(typeof lastValue).toBe("number");
    });

    it("applies disabled attribute", () => {
        const wrapper = mount(TextInput, { props: { disabled: true } });
        expect(wrapper.find("input").attributes("disabled")).toBeDefined();
    });

    it("applies compact size classes", () => {
        const wrapper = mount(TextInput, { props: { size: "compact" } });
        const input = wrapper.find("input");
        expect(input.classes()).toContain("rounded-lg");
        expect(input.classes()).toContain("text-[12px]");
    });

    it("applies default size classes", () => {
        const wrapper = mount(TextInput, { props: { size: "default" } });
        const input = wrapper.find("input");
        expect(input.classes()).toContain("rounded-xl");
        expect(input.classes()).toContain("text-[13px]");
    });

    it("applies warning border class when warning is true", () => {
        const wrapper = mount(TextInput, { props: { warning: true } });
        const input = wrapper.find("input");
        expect(input.classes()).toContain("border-amber-500/40");
    });

    it("applies error border class when error is set", () => {
        const wrapper = mount(TextInput, { props: { error: "Bad value" } });
        const input = wrapper.find("input");
        expect(input.classes()).toContain("border-red-500/60");
    });

    it("exposes focus method", () => {
        const wrapper = mount(TextInput);
        expect(typeof wrapper.vm.focus).toBe("function");
    });

    it("passes placeholder", () => {
        const wrapper = mount(TextInput, { props: { placeholder: "Enter value" } });
        expect(wrapper.find("input").attributes("placeholder")).toBe("Enter value");
    });

    it("passes min/max/step for number inputs", () => {
        const wrapper = mount(TextInput, {
            props: { type: "number", min: 0, max: 100, step: 0.1 },
        });
        const input = wrapper.find("input");
        expect(input.attributes("min")).toBe("0");
        expect(input.attributes("max")).toBe("100");
        expect(input.attributes("step")).toBe("0.1");
    });
});
