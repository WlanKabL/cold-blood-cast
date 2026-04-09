import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Select from "../Select.vue";

describe("UiSelect", () => {
    const options = `
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
    `;

    it("renders a select element", () => {
        const wrapper = mount(Select, { slots: { default: options } });
        expect(wrapper.find("select").exists()).toBe(true);
    });

    it("renders label when provided", () => {
        const wrapper = mount(Select, {
            props: { label: "Account" },
            slots: { default: options },
        });
        expect(wrapper.find("label").text()).toBe("Account");
    });

    it("renders placeholder option when provided", () => {
        const wrapper = mount(Select, {
            props: { placeholderOption: "Choose one" },
            slots: { default: options },
        });
        const opts = wrapper.findAll("option");
        expect(opts[0].text()).toBe("Choose one");
        expect(opts[0].attributes("disabled")).toBeDefined();
    });

    it("emits update:modelValue on change", async () => {
        const wrapper = mount(Select, {
            props: { modelValue: "a" },
            slots: { default: options },
        });
        await wrapper.find("select").setValue("b");
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        expect(wrapper.emitted("update:modelValue")![0][0]).toBe("b");
    });

    it("applies disabled attribute", () => {
        const wrapper = mount(Select, {
            props: { disabled: true },
            slots: { default: options },
        });
        expect(wrapper.find("select").attributes("disabled")).toBeDefined();
    });

    it("applies compact size classes", () => {
        const wrapper = mount(Select, {
            props: { size: "compact" },
            slots: { default: options },
        });
        expect(wrapper.find("select").classes()).toContain("rounded-lg");
    });

    it("applies purple accent classes", () => {
        const wrapper = mount(Select, {
            props: { accent: "purple" },
            slots: { default: options },
        });
        const classes = wrapper.find("select").classes().join(" ");
        expect(classes).toContain("focus:border-purple-500/50");
    });

    it("renders hint text", () => {
        const wrapper = mount(Select, {
            props: { hint: "Pick wisely" },
            slots: { default: options },
        });
        expect(wrapper.text()).toContain("Pick wisely");
    });

    it("renders error text", () => {
        const wrapper = mount(Select, {
            props: { error: "Required" },
            slots: { default: options },
        });
        expect(wrapper.text()).toContain("Required");
    });
});
