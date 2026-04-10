import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTags } from "../useTags";

// ─── Mock Nuxt auto-imports ──────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.stubGlobal("useApi", () => ({
    get: mockGet,
    post: mockPost,
}));

// ─── Tests ───────────────────────────────────────────────────

beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
});

describe("useTags", () => {
    it("fetches tags on initialization", async () => {
        const mockTags = [
            { id: "1", name: "feeding", category: "care", color: "#ff0000" },
            { id: "2", name: "health", category: "care", color: "#00ff00" },
        ];
        mockGet.mockResolvedValueOnce(mockTags);

        const { tags } = useTags();

        // Wait for the async fetchTags() in constructor
        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith("/api/tags");
        });

        expect(tags.value).toEqual(mockTags);
    });

    it("sets empty array when fetch fails", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network error"));

        const { tags } = useTags();

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });

        expect(tags.value).toEqual([]);
    });

    it("fetchTags refreshes tag list", async () => {
        const initial = [{ id: "1", name: "a", category: null, color: null }];
        const updated = [
            { id: "1", name: "a", category: null, color: null },
            { id: "2", name: "b", category: null, color: null },
        ];

        mockGet.mockResolvedValueOnce(initial);

        const { tags, fetchTags } = useTags();

        await vi.waitFor(() => {
            expect(tags.value).toEqual(initial);
        });

        mockGet.mockResolvedValueOnce(updated);
        await fetchTags();

        expect(tags.value).toEqual(updated);
    });

    it("createTag posts and adds to local list", async () => {
        mockGet.mockResolvedValueOnce([]);

        const { tags, createTag } = useTags();

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });

        const newTag = { id: "3", name: "shedding", category: "care", color: "#0000ff" };
        mockPost.mockResolvedValueOnce(newTag);

        const result = await createTag({ name: "shedding", category: "care", color: "#0000ff" });

        expect(mockPost).toHaveBeenCalledWith("/api/tags", {
            name: "shedding",
            category: "care",
            color: "#0000ff",
        });
        expect(result).toEqual(newTag);
        expect(tags.value).toContainEqual(newTag);
    });

    it("createTag propagates errors", async () => {
        mockGet.mockResolvedValueOnce([]);

        const { createTag } = useTags();

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });

        mockPost.mockRejectedValueOnce(new Error("Validation error"));

        await expect(createTag({ name: "" })).rejects.toThrow("Validation error");
    });
});
