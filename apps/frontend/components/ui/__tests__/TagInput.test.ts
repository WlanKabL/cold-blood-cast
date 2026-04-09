import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import TagInput from "../TagInput.vue";

const mockTags = ref([
    { name: "Feeding", category: "general", color: "#3b82f6" },
    { name: "Shedding", category: "general", color: "#10b981" },
    { name: "Health Check", category: "general", color: null },
]);

vi.stubGlobal("useTags", () => ({
    tags: mockTags,
    fetchTags: vi.fn(),
    createTag: vi.fn(),
}));

vi.stubGlobal("useI18n", () => ({
    t: (key: string) => key,
}));

vi.stubGlobal("onClickOutside", vi.fn());

describe("UiTagInput", () => {
    const stubs = { Icon: true, UiTagBadge: true, Transition: false };
    const mocks = { $t: (key: string) => key };

    it("renders input element", () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [] },
            global: { stubs, mocks },
        });
        expect(wrapper.find("input").exists()).toBe(true);
    });

    it("renders placeholder from prop", () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [], placeholder: "Add tags..." },
            global: { stubs, mocks },
        });
        expect(wrapper.find("input").attributes("placeholder")).toBe("Add tags...");
    });

    it("renders selected tags above input in stacked mode", () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: ["Feeding", "Shedding"], inline: false },
            global: { stubs, mocks },
        });
        const badges = wrapper.findAllComponents({ name: "UiTagBadge" });
        expect(badges.length).toBe(2);
    });

    it("renders selected tags inline when inline prop is true", () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: ["Feeding"], inline: true },
            global: { stubs, mocks },
        });
        const badges = wrapper.findAllComponents({ name: "UiTagBadge" });
        expect(badges.length).toBe(1);
    });

    it("shows dropdown on input focus", async () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [] },
            global: { stubs, mocks },
        });
        await wrapper.find("input").trigger("focus");
        const dropdown = wrapper.find(".absolute");
        expect(dropdown.exists()).toBe(true);
    });

    it("filters dropdown options based on typed input", async () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [] },
            global: { stubs, mocks },
        });
        await wrapper.find("input").trigger("focus");
        await wrapper.find("input").setValue("Fee");
        const buttons = wrapper.findAll(".absolute button");
        const tagButtons = buttons.filter((b) => b.text().includes("Feeding"));
        expect(tagButtons.length).toBe(1);
    });

    it("emits update:modelValue when a tag is selected", async () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [] },
            global: { stubs, mocks },
        });
        await wrapper.find("input").trigger("focus");
        const buttons = wrapper.findAll(".absolute button");
        const scalpBtn = buttons.find((b) => b.text().includes("Feeding"));
        if (scalpBtn) {
            await scalpBtn.trigger("mousedown");
        }
        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        expect(wrapper.emitted("update:modelValue")![0][0]).toContain("Feeding");
    });

    it("renders hint text when provided", () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: [], hint: "Max 5 tags" },
            global: { stubs, mocks },
        });
        expect(wrapper.text()).toContain("Max 5 tags");
    });

    it("does not show selected tags in dropdown", async () => {
        const wrapper = mount(TagInput, {
            props: { modelValue: ["Feeding"] },
            global: { stubs, mocks },
        });
        await wrapper.find("input").trigger("focus");
        const buttons = wrapper.findAll(".absolute button");
        const scalpBtn = buttons.find((b) => b.text().includes("Feeding"));
        expect(scalpBtn).toBeUndefined();
    });
});
