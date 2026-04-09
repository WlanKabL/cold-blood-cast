import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Modal from "../Modal.vue";

describe("UiModal", () => {
    it("renders slot content when show is true", () => {
        const wrapper = mount(Modal, {
            props: { show: true },
            slots: { default: "<p>Modal content</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        expect(wrapper.text()).toContain("Modal content");
    });

    it("does not render content when show is false", () => {
        const wrapper = mount(Modal, {
            props: { show: false },
            slots: { default: "<p>Hidden</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        expect(wrapper.text()).not.toContain("Hidden");
    });

    it("renders title when provided", () => {
        const wrapper = mount(Modal, {
            props: { show: true, title: "Confirm" },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        expect(wrapper.find("h2").text()).toBe("Confirm");
    });

    it("does not render header when no title and no header slot", () => {
        const wrapper = mount(Modal, {
            props: { show: true },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        expect(wrapper.find("h2").exists()).toBe(false);
    });

    it("emits close when close button is clicked", async () => {
        const wrapper = mount(Modal, {
            props: { show: true, title: "Test" },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        await wrapper.find("button").trigger("click");
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("applies md width class by default", () => {
        const wrapper = mount(Modal, {
            props: { show: true },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        const inner = wrapper.find(".rounded-2xl");
        expect(inner.classes()).toContain("max-w-lg");
    });

    it("applies lg width class when width=lg", () => {
        const wrapper = mount(Modal, {
            props: { show: true, width: "lg" },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        const inner = wrapper.find(".rounded-2xl");
        expect(inner.classes()).toContain("max-w-2xl");
    });

    it("renders custom header slot", () => {
        const wrapper = mount(Modal, {
            props: { show: true },
            slots: {
                header: "<h3>Custom Header</h3>",
                default: "<p>Body</p>",
            },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        expect(wrapper.text()).toContain("Custom Header");
    });

    it("emits close on Escape key when visible", async () => {
        const wrapper = mount(Modal, {
            props: { show: true, title: "Test" },
            slots: { default: "<p>Body</p>" },
            global: { stubs: { Teleport: true, Transition: false, Icon: true } },
        });
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(wrapper.emitted("close")).toBeTruthy();
    });
});
