import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ImageLightbox from "../ImageLightbox.vue";

vi.stubGlobal(
    "nextTick",
    vi.fn((cb?: () => void) => {
        cb?.();
        return Promise.resolve();
    }),
);

const stubs = {
    Icon: true,
    Teleport: true,
    Transition: true,
};

describe("ImageLightbox", () => {
    it("renders nothing when url is null", () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: null },
            global: { stubs },
        });
        expect(wrapper.find("img").exists()).toBe(false);
    });

    it("renders image when url is provided", () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/screenshot.png" },
            global: { stubs },
        });
        const img = wrapper.find("img");
        expect(img.exists()).toBe(true);
        expect(img.attributes("src")).toBe("https://example.com/screenshot.png");
    });

    it("uses alt text when provided", () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png", alt: "Sensor chart" },
            global: { stubs },
        });
        const img = wrapper.find("img");
        expect(img.attributes("alt")).toBe("Sensor chart");
    });

    it("renders close button when url is provided", () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png" },
            global: { stubs },
        });
        const closeBtn = wrapper.find("button");
        expect(closeBtn.exists()).toBe(true);
    });

    it("emits close when overlay is clicked", async () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png" },
            global: { stubs },
        });
        const overlay = wrapper.find("div[tabindex='-1']");
        await overlay.trigger("click");
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close when close button is clicked", async () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png" },
            global: { stubs },
        });
        const closeBtn = wrapper.find("button");
        await closeBtn.trigger("click");
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close on Escape keydown", async () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png" },
            global: { stubs },
        });
        const overlay = wrapper.find("div[tabindex='-1']");
        await overlay.trigger("keydown", { key: "Escape" });
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("does not emit close when image is clicked (stops propagation)", async () => {
        const wrapper = mount(ImageLightbox, {
            props: { url: "https://example.com/img.png" },
            global: { stubs },
        });
        const img = wrapper.find("img");
        await img.trigger("click");
        // click.stop on the image prevents the overlay click from firing
        // Only one close event from the overlay's click handler should NOT be emitted
        expect(wrapper.emitted("close")).toBeUndefined();
    });
});
