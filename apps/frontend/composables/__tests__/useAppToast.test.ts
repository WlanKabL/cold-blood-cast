import { describe, it, expect, vi, beforeEach } from "vitest";

import { useAppToast } from "../useAppToast";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal("crypto", {
    randomUUID: () => `uuid-${++uuidCounter}`,
});

describe("useAppToast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        uuidCounter = 0;
        // Clear toasts between tests by removing all
        const toast = useAppToast();
        while (toast.toasts.value.length > 0) {
            toast.remove(toast.toasts.value[0].id);
        }
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("adds a toast with generated ID", () => {
        const toast = useAppToast();
        toast.add({ title: "Hello", color: "green", timeout: 3000 });
        expect(toast.toasts.value).toHaveLength(1);
        expect(toast.toasts.value[0].title).toBe("Hello");
        expect(toast.toasts.value[0].id).toBe("uuid-1");
    });

    it("removes a toast by ID", () => {
        const toast = useAppToast();
        toast.add({ title: "Test", color: "blue", timeout: 0 });
        const id = toast.toasts.value[0].id;
        toast.remove(id);
        expect(toast.toasts.value).toHaveLength(0);
    });

    it("remove is no-op for unknown ID", () => {
        const toast = useAppToast();
        toast.add({ title: "Test", color: "blue", timeout: 0 });
        toast.remove("nonexistent");
        expect(toast.toasts.value).toHaveLength(1);
    });

    it("auto-removes after timeout", () => {
        const toast = useAppToast();
        toast.add({ title: "Timed", color: "green", timeout: 3000 });
        expect(toast.toasts.value).toHaveLength(1);

        vi.advanceTimersByTime(3000);
        expect(toast.toasts.value).toHaveLength(0);
    });

    it("does not auto-remove when timeout is 0", () => {
        const toast = useAppToast();
        toast.add({ title: "Persistent", color: "red", timeout: 0 });
        vi.advanceTimersByTime(10000);
        expect(toast.toasts.value).toHaveLength(1);
    });

    it("evicts oldest toast when exceeding max (5)", () => {
        const toast = useAppToast();
        for (let i = 0; i < 6; i++) {
            toast.add({ title: `Toast ${i}`, color: "blue", timeout: 0 });
        }
        expect(toast.toasts.value).toHaveLength(5);
        expect(toast.toasts.value[0].title).toBe("Toast 1"); // Toast 0 evicted
    });

    describe("convenience methods", () => {
        it("success() creates green toast with 3s timeout", () => {
            const toast = useAppToast();
            toast.success("Saved!");
            const t = toast.toasts.value.at(-1)!;
            expect(t.color).toBe("green");
            expect(t.timeout).toBe(3000);
        });

        it("error() creates red toast with 5s timeout", () => {
            const toast = useAppToast();
            toast.error("Failed!");
            const t = toast.toasts.value.at(-1)!;
            expect(t.color).toBe("red");
            expect(t.timeout).toBe(5000);
        });

        it("warn() creates amber toast with 4s timeout", () => {
            const toast = useAppToast();
            toast.warn("Warning!");
            const t = toast.toasts.value.at(-1)!;
            expect(t.color).toBe("amber");
            expect(t.timeout).toBe(4000);
        });

        it("info() creates blue toast with 3s timeout", () => {
            const toast = useAppToast();
            toast.info("Note");
            const t = toast.toasts.value.at(-1)!;
            expect(t.color).toBe("blue");
            expect(t.timeout).toBe(3000);
        });

        it("accepts description and custom timeout", () => {
            const toast = useAppToast();
            toast.success("Done", { description: "All good", timeout: 1000 });
            const t = toast.toasts.value.at(-1)!;
            expect((t as Record<string, unknown>).description).toBe("All good");
            expect(t.timeout).toBe(1000);
        });
    });
});
