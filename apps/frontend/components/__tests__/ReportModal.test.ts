import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ReportModal from "../ReportModal.vue";

const stubs = {
    Icon: true,
    Teleport: true,
    Transition: { template: "<div><slot /></div>" },
};

// ─── Mocks ─────────────────────────────────────────────────

const mockT = (key: string) => key;

vi.stubGlobal("useI18n", () => ({ t: mockT }));
vi.stubGlobal("useRuntimeConfig", () => ({
    public: { apiBaseURL: "http://localhost:4000" },
}));

function mountModal(props: Partial<InstanceType<typeof ReportModal>["$props"]> = {}) {
    return mount(ReportModal, {
        props: {
            open: true,
            targetType: "comment",
            targetId: "target_001",
            ...props,
        },
        global: {
            stubs,
            mocks: { $t: mockT },
        },
    });
}

describe("ReportModal", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal("fetch", fetchMock);
    });

    // ─── Rendering ──────────────────────────────────────────

    it("renders modal content when open is true", () => {
        const wrapper = mountModal({ open: true });

        expect(wrapper.text()).toContain("report.title");
        expect(wrapper.text()).toContain("report.description");
        expect(wrapper.find("select").exists()).toBe(true);
        expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("renders nothing when open is false", () => {
        const wrapper = mountModal({ open: false });

        expect(wrapper.find("select").exists()).toBe(false);
        expect(wrapper.find("textarea").exists()).toBe(false);
    });

    // ─── Reason Dropdown ────────────────────────────────────

    it("has 5 reason options plus disabled placeholder", () => {
        const wrapper = mountModal();

        const options = wrapper.findAll("option");
        // 1 disabled placeholder + 5 reason options = 6
        expect(options.length).toBe(6);
        expect(options[0].attributes("disabled")).toBeDefined();
    });

    it("shows all reason keys", () => {
        const wrapper = mountModal();

        const text = wrapper.text();
        expect(text).toContain("report.reasons.spam");
        expect(text).toContain("report.reasons.harassment");
        expect(text).toContain("report.reasons.inappropriate");
        expect(text).toContain("report.reasons.misinformation");
        expect(text).toContain("report.reasons.other");
    });

    // ─── Submit Button State ────────────────────────────────

    it("submit button is disabled when no reason is selected", () => {
        const wrapper = mountModal();

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        expect(submitBtn?.attributes("disabled")).toBeDefined();
    });

    it("submit button becomes enabled after selecting a reason", async () => {
        const wrapper = mountModal();

        await wrapper.find("select").setValue("spam");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        expect(submitBtn?.attributes("disabled")).toBeUndefined();
    });

    // ─── Description Character Count ────────────────────────

    it("shows character count for description", async () => {
        const wrapper = mountModal();

        expect(wrapper.text()).toContain("0/1000");

        await wrapper.find("textarea").setValue("Hello world");

        expect(wrapper.text()).toContain("11/1000");
    });

    // ─── Close Emission ─────────────────────────────────────

    it("emits close when X button is clicked", async () => {
        const wrapper = mountModal();

        // X button is the first button in the header
        const buttons = wrapper.findAll("button");
        const closeBtn = buttons.find((b) => b.find("[class*='h-4 w-4']").exists());
        await closeBtn?.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close when cancel button is clicked", async () => {
        const wrapper = mountModal();

        const cancelBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("common.cancel"),
        );
        await cancelBtn?.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close when backdrop is clicked", async () => {
        const wrapper = mountModal();

        // The backdrop is the outermost .fixed div
        const backdrop = wrapper.find(".fixed.inset-0");
        await backdrop.trigger("click");

        expect(wrapper.emitted("close")).toBeTruthy();
    });

    // ─── Form Submission ────────────────────────────────────

    it("sends POST request with correct body on submit", async () => {
        const wrapper = mountModal({
            targetType: "user_profile",
            targetId: "user_123",
            targetUrl: "https://example.com/profile",
        });

        await wrapper.find("select").setValue("harassment");
        await wrapper.find("textarea").setValue("This is a test report");
        await wrapper.find('input[type="text"]').setValue("Reporter Name");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        // Wait for async
        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("http://localhost:4000/api/public/reports");
        expect(options.method).toBe("POST");

        const body = JSON.parse(options.body);
        expect(body.targetType).toBe("user_profile");
        expect(body.targetId).toBe("user_123");
        expect(body.targetUrl).toBe("https://example.com/profile");
        expect(body.reason).toBe("harassment");
        expect(body.description).toBe("This is a test report");
        expect(body.reporterName).toBe("Reporter Name");
    });

    it("omits empty optional fields from request body", async () => {
        const wrapper = mountModal();

        await wrapper.find("select").setValue("spam");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.description).toBeUndefined();
        expect(body.reporterName).toBeUndefined();
    });

    it("emits submitted and close on successful submit", async () => {
        const wrapper = mountModal();

        await wrapper.find("select").setValue("spam");
        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(wrapper.emitted("submitted")).toBeTruthy();
        });
        expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("resets form after successful submit", async () => {
        const wrapper = mountModal();

        await wrapper.find("select").setValue("spam");
        await wrapper.find("textarea").setValue("some desc");
        await wrapper.find('input[type="text"]').setValue("Some reporter");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        // After reset the form fields should be empty
        const select = wrapper.find("select").element as HTMLSelectElement;
        const textarea = wrapper.find("textarea").element as HTMLTextAreaElement;
        const input = wrapper.find('input[type="text"]').element as HTMLInputElement;

        expect(select.value).toBe("");
        expect(textarea.value).toBe("");
        expect(input.value).toBe("");
    });

    it("does not emit submitted on failed fetch", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

        const wrapper = mountModal();
        await wrapper.find("select").setValue("spam");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        expect(wrapper.emitted("submitted")).toBeFalsy();
    });

    it("does not emit submitted on network error", async () => {
        fetchMock.mockRejectedValueOnce(new Error("Network error"));

        const wrapper = mountModal();
        await wrapper.find("select").setValue("spam");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        expect(wrapper.emitted("submitted")).toBeFalsy();
    });

    // ─── Different Target Types ─────────────────────────────

    it("sends comment target type in request", async () => {
        const wrapper = mountModal({ targetType: "comment", targetId: "comment_001" });

        await wrapper.find("select").setValue("spam");
        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.targetType).toBe("comment");
        expect(body.targetId).toBe("comment_001");
    });

    it("sends pet_profile target type in request", async () => {
        const wrapper = mountModal({ targetType: "pet_profile", targetId: "pet_001" });

        await wrapper.find("select").setValue("inappropriate");
        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce();
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.targetType).toBe("pet_profile");
        expect(body.targetId).toBe("pet_001");
    });

    // ─── Prevents Double Submit ─────────────────────────────

    it("disables submit button while submitting", async () => {
        let resolvePromise: (() => void) | undefined;
        fetchMock.mockImplementationOnce(
            () => new Promise<{ ok: boolean }>((resolve) => {
                resolvePromise = () => resolve({ ok: true });
            }),
        );

        const wrapper = mountModal();
        await wrapper.find("select").setValue("spam");

        const submitBtn = wrapper.findAll("button").find(
            (b) => b.text().includes("report.submit"),
        );
        await submitBtn?.trigger("click");

        // While submitting, button should be disabled
        expect(submitBtn?.attributes("disabled")).toBeDefined();

        // Resolve the fetch
        resolvePromise?.();
    });
});
