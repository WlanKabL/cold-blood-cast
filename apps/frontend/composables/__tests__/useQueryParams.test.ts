import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nextTick } from "vue";
import { useQueryParams } from "../useQueryParams";

/* ------------------------------------------------------------------ */
/*  Mock vue-router                                                    */
/* ------------------------------------------------------------------ */

const mockQuery: Record<string, string | undefined> = {};
const mockReplace = vi.fn();

vi.mock("vue-router", () => ({
    useRoute: () => ({ query: mockQuery }),
    useRouter: () => ({ replace: mockReplace }),
}));

/* ------------------------------------------------------------------ */

function clearQuery() {
    for (const key of Object.keys(mockQuery)) {
        Reflect.deleteProperty(mockQuery, key);
    }
}

beforeEach(() => {
    clearQuery();
    mockReplace.mockClear();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("useQueryParams", () => {
    const schema = {
        species: { type: "string" as const, default: "" },
        page: { type: "number" as const, default: 1 },
        tags: { type: "string[]" as const, default: [] as string[] },
    };

    it("returns defaults when URL has no query params", () => {
        const { state } = useQueryParams(schema);
        expect(state.species).toBe("");
        expect(state.page).toBe(1);
        expect(state.tags).toEqual([]);
    });

    it("reads string param from URL", () => {
        mockQuery.species = "Ball Python";
        const { state } = useQueryParams(schema);
        expect(state.species).toBe("Ball Python");
    });

    it("reads number param from URL", () => {
        mockQuery.page = "3";
        const { state } = useQueryParams(schema);
        expect(state.page).toBe(3);
    });

    it("falls back to default for invalid number", () => {
        mockQuery.page = "abc";
        const { state } = useQueryParams(schema);
        expect(state.page).toBe(1);
    });

    it("reads string[] param from comma-separated URL value", () => {
        mockQuery.tags = "breakout,scalping";
        const { state } = useQueryParams(schema);
        expect(state.tags).toEqual(["breakout", "scalping"]);
    });

    it("handles empty string[] gracefully", () => {
        mockQuery.tags = "";
        const { state } = useQueryParams(schema);
        expect(state.tags).toEqual([]);
    });

    it("syncs state changes to URL after debounce", async () => {
        const { state } = useQueryParams(schema, { debounce: 100 });
        state.species = "Corn Snake";
        await nextTick();
        // Not synced yet
        expect(mockReplace).not.toHaveBeenCalled();
        // After debounce
        vi.advanceTimersByTime(100);
        expect(mockReplace).toHaveBeenCalledWith({
            query: { species: "Corn Snake" },
        });
    });

    it("omits default values from URL query", async () => {
        const { state } = useQueryParams(schema, { debounce: 0 });
        // First change to non-default
        state.species = "Ball Python";
        await nextTick();
        vi.advanceTimersByTime(10);
        mockReplace.mockClear();
        // Now revert to default
        state.species = "";
        await nextTick();
        vi.advanceTimersByTime(10);
        // Should replace with empty query (all defaults)
        expect(mockReplace).toHaveBeenCalledWith({ query: {} });
    });

    it("includes non-default values in URL query", async () => {
        const { state } = useQueryParams(schema, { debounce: 0 });
        state.page = 5;
        state.species = "Ball Python";
        state.tags = ["health", "feeding"];
        await nextTick();
        vi.advanceTimersByTime(10);
        expect(mockReplace).toHaveBeenCalledWith({
            query: {
                page: "5",
                species: "Ball Python",
                tags: "health,feeding",
            },
        });
    });

    it("resetFilters restores all to defaults", () => {
        mockQuery.species = "Ball Python";
        mockQuery.page = "3";
        mockQuery.tags = "health";
        const { state, resetFilters } = useQueryParams(schema);
        expect(state.species).toBe("Ball Python");
        expect(state.page).toBe(3);

        resetFilters();
        expect(state.species).toBe("");
        expect(state.page).toBe(1);
        expect(state.tags).toEqual([]);
    });

    it("preserves unknown query params (e.g. fromPlan)", async () => {
        mockQuery.enclosureId = "enc_123";
        mockQuery.species = "Ball Python";
        const { state } = useQueryParams(schema, { debounce: 0 });
        state.species = "Corn Snake";
        await nextTick();
        vi.advanceTimersByTime(10);
        expect(mockReplace).toHaveBeenCalledWith({
            query: expect.objectContaining({
                enclosureId: "enc_123",
                species: "Corn Snake",
            }),
        });
    });
});
