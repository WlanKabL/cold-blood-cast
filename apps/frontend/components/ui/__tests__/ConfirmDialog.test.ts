import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmDialog from "../ConfirmDialog.vue";

const stubs = {
    Icon: true,
    UiModal: {
        template: '<div class="modal-stub"><slot name="header" /><slot /></div>',
        props: ["show", "width"],
        emits: ["close"],
    },
};

describe("UiConfirmDialog", () => {
    it("renders the title", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Delete Account?" },
            global: { stubs },
        });
        expect(wrapper.text()).toContain("Delete Account?");
    });

    it("renders the message when provided", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm", message: "Are you sure?" },
            global: { stubs },
        });
        expect(wrapper.text()).toContain("Are you sure?");
    });

    it("does not render message element when message is not provided", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm" },
            global: { stubs },
        });
        expect(wrapper.find("p").exists()).toBe(false);
    });

    it("renders confirm and cancel buttons with default labels", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm" },
            global: { stubs },
        });
        expect(wrapper.text()).toContain("Confirm");
        expect(wrapper.text()).toContain("Cancel");
    });

    it("uses custom confirm and cancel labels", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Test", confirmLabel: "Yes, delete", cancelLabel: "No, keep" },
            global: { stubs },
        });
        expect(wrapper.text()).toContain("Yes, delete");
        expect(wrapper.text()).toContain("No, keep");
    });

    it("emits confirm when confirm button is clicked", async () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm" },
            global: { stubs },
        });
        const buttons = wrapper.findAll("button");
        const confirmBtn = buttons.find((b) => b.text().includes("Confirm"));
        await confirmBtn!.trigger("click");
        expect(wrapper.emitted("confirm")).toBeTruthy();
    });

    it("emits cancel when cancel button is clicked", async () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm" },
            global: { stubs },
        });
        const buttons = wrapper.findAll("button");
        const cancelBtn = buttons.find((b) => b.text().includes("Cancel"));
        await cancelBtn!.trigger("click");
        expect(wrapper.emitted("cancel")).toBeTruthy();
    });

    it("disables confirm button when loading", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm", loading: true },
            global: { stubs },
        });
        const buttons = wrapper.findAll("button");
        const confirmBtn = buttons.find((b) => b.text().includes("Confirm"));
        expect(confirmBtn!.attributes("disabled")).toBeDefined();
    });

    it("disables confirm button when confirmDisabled is true", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm", confirmDisabled: true },
            global: { stubs },
        });
        const buttons = wrapper.findAll("button");
        const confirmBtn = buttons.find((b) => b.text().includes("Confirm"));
        expect(confirmBtn!.attributes("disabled")).toBeDefined();
    });

    it("applies danger variant styling", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Delete?", variant: "danger" },
            global: { stubs },
        });
        // Red icon background
        const iconWrapper = wrapper.find(".bg-red-500\\/10");
        expect(iconWrapper.exists()).toBe(true);
        // Red confirm button
        const buttons = wrapper.findAll("button");
        const confirmBtn = buttons.find((b) => b.text().includes("Confirm"));
        expect(confirmBtn!.classes()).toContain("bg-red-500");
    });

    it("applies default variant styling", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Confirm?" },
            global: { stubs },
        });
        // Primary icon background
        const iconWrapper = wrapper.find(".bg-primary-500\\/10");
        expect(iconWrapper.exists()).toBe(true);
        // Accent confirm button
        const buttons = wrapper.findAll("button");
        const confirmBtn = buttons.find((b) => b.text().includes("Confirm"));
        expect(confirmBtn!.classes()).toContain("bg-accent");
    });

    it("uses custom icon when provided", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Export?", icon: "lucide:download" },
            global: { stubs },
        });
        // Icon stub should exist (rendered as a stub)
        const iconStubs = wrapper.findAll("icon-stub");
        const downloadIcon = iconStubs.find((s) => s.attributes("name") === "lucide:download");
        expect(downloadIcon).toBeDefined();
    });

    it("renders slot content (custom body)", () => {
        const wrapper = mount(ConfirmDialog, {
            props: { title: "Test" },
            global: { stubs },
            slots: { default: '<p class="custom-content">Extra info</p>' },
        });
        expect(wrapper.text()).toContain("Extra info");
    });
});
