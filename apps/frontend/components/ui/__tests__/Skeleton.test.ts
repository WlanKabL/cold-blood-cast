import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Skeleton from "../Skeleton.vue";

describe("UiSkeleton", () => {
    it("renders a div element", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.element.tagName).toBe("DIV");
    });

    it("has animate-pulse class", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.classes()).toContain("animate-pulse");
    });

    it("has bg-surface-2 class", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.classes()).toContain("bg-surface-2");
    });

    // ─── Height ──────────────────────────────────────

    it("applies default height of 16px", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.element.style.height).toBe("16px");
    });

    it("applies numeric height as px", () => {
        const wrapper = mount(Skeleton, { props: { height: "32" } });
        expect(wrapper.element.style.height).toBe("32px");
    });

    it("applies CSS height value directly", () => {
        const wrapper = mount(Skeleton, { props: { height: "2rem" } });
        expect(wrapper.element.style.height).toBe("2rem");
    });

    it("applies percentage height", () => {
        const wrapper = mount(Skeleton, { props: { height: "100%" } });
        expect(wrapper.element.style.height).toBe("100%");
    });

    // ─── Width ───────────────────────────────────────

    it("does not set width by default", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.element.style.width).toBe("");
    });

    it("applies numeric width as px", () => {
        const wrapper = mount(Skeleton, { props: { width: "200" } });
        expect(wrapper.element.style.width).toBe("200px");
    });

    it("applies CSS width value directly", () => {
        const wrapper = mount(Skeleton, { props: { width: "50%" } });
        expect(wrapper.element.style.width).toBe("50%");
    });

    // ─── Rounded variants ────────────────────────────

    it("applies rounded (md) by default", () => {
        const wrapper = mount(Skeleton);
        expect(wrapper.classes()).toContain("rounded");
    });

    it("applies rounded-none", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "none" } });
        expect(wrapper.classes()).toContain("rounded-none");
    });

    it("applies rounded-sm", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "sm" } });
        expect(wrapper.classes()).toContain("rounded-sm");
    });

    it("applies rounded-lg", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "lg" } });
        expect(wrapper.classes()).toContain("rounded-lg");
    });

    it("applies rounded-xl", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "xl" } });
        expect(wrapper.classes()).toContain("rounded-xl");
    });

    it("applies rounded-2xl", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "2xl" } });
        expect(wrapper.classes()).toContain("rounded-2xl");
    });

    it("applies rounded-full", () => {
        const wrapper = mount(Skeleton, { props: { rounded: "full" } });
        expect(wrapper.classes()).toContain("rounded-full");
    });

    // ─── Dimension combos ────────────────────────────

    it("applies both width and height", () => {
        const wrapper = mount(Skeleton, { props: { width: "100", height: "20" } });
        expect(wrapper.element.style.width).toBe("100px");
        expect(wrapper.element.style.height).toBe("20px");
    });

    it("handles decimal numeric values", () => {
        const wrapper = mount(Skeleton, { props: { height: "16.5" } });
        expect(wrapper.element.style.height).toBe("16.5px");
    });
});
