import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PhotoLightbox from "../PhotoLightbox.vue";

const stubs = {
    Icon: true,
    Teleport: true,
    Transition: { template: "<div><slot /></div>" },
};

describe("PhotoLightbox", () => {
    it("renders nothing when show is false", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: false, src: "/test.jpg" },
            global: { stubs },
        });

        expect(wrapper.find("img").exists()).toBe(false);
    });

    it("renders image when show is true", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/uploads/test.jpg" },
            global: { stubs },
        });

        const img = wrapper.find("img");
        expect(img.exists()).toBe(true);
        expect(img.attributes("src")).toBe("/uploads/test.jpg");
    });

    it("displays caption when provided", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", caption: "My snake" },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("My snake");
    });

    it("displays takenAt date when provided", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", takenAt: "2024-06-15T10:00:00.000Z" },
            global: { stubs },
        });

        const formatted = new Date("2024-06-15T10:00:00.000Z").toLocaleDateString();
        expect(wrapper.text()).toContain(formatted);
    });

    it("displays tags when provided", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", tags: ["portrait", "shedding"] },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("portrait");
        expect(wrapper.text()).toContain("shedding");
    });

    it("shows counter when total > 1", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", current: 2, total: 5 },
            global: { stubs },
        });

        expect(wrapper.text()).toContain("3 / 5");
    });

    it("hides counter when total <= 1", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", total: 1 },
            global: { stubs },
        });

        expect(wrapper.text()).not.toContain("/ 1");
    });

    it("shows prev button when hasPrev is true", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", hasPrev: true, hasNext: false },
            global: { stubs },
        });

        const buttons = wrapper.findAll("button");
        const prevButton = buttons.find((b) => b.attributes("class")?.includes("left-4"));
        expect(prevButton?.exists()).toBe(true);
    });

    it("hides prev button when hasPrev is false", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", hasPrev: false, hasNext: false },
            global: { stubs },
        });

        const buttons = wrapper.findAll("button");
        const prevButton = buttons.find((b) => b.attributes("class")?.includes("left-4"));
        expect(prevButton).toBeUndefined();
    });

    it("shows next button when hasNext is true", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", hasPrev: false, hasNext: true },
            global: { stubs },
        });

        const buttons = wrapper.findAll("button");
        const nextButton = buttons.find(
            (b) =>
                b.attributes("class")?.includes("right-4") &&
                !b.attributes("class")?.includes("top-4"),
        );
        expect(nextButton?.exists()).toBe(true);
    });

    it("emits close when close button clicked", async () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg" },
            global: { stubs },
        });

        const closeButton = wrapper
            .findAll("button")
            .find((b) => b.attributes("class")?.includes("top-4"));
        await closeButton?.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close when backdrop clicked", async () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg" },
            global: { stubs },
        });

        const backdrop = wrapper.find(".fixed.inset-0");
        await backdrop.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits prev when prev button clicked", async () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", hasPrev: true },
            global: { stubs },
        });

        const buttons = wrapper.findAll("button");
        const prevButton = buttons.find((b) => b.attributes("class")?.includes("left-4"));
        await prevButton?.trigger("click");

        expect(wrapper.emitted("prev")).toBeTruthy();
    });

    it("emits next when next button clicked", async () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", hasNext: true },
            global: { stubs },
        });

        const buttons = wrapper.findAll("button");
        const nextButton = buttons.find(
            (b) =>
                b.attributes("class")?.includes("right-4") &&
                !b.attributes("class")?.includes("top-4"),
        );
        await nextButton?.trigger("click");

        expect(wrapper.emitted("next")).toBeTruthy();
    });

    it("uses alt text from caption", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg", caption: "Snake portrait" },
            global: { stubs },
        });

        expect(wrapper.find("img").attributes("alt")).toBe("Snake portrait");
    });

    it("uses fallback alt text when no caption", () => {
        const wrapper = mount(PhotoLightbox, {
            props: { show: true, src: "/test.jpg" },
            global: { stubs },
        });

        expect(wrapper.find("img").attributes("alt")).toBe("Photo");
    });
});
