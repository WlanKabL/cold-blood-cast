import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/config/env.js", () => ({
    env: () => ({
        UPLOAD_DIR: "/tmp/test-uploads",
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    }),
}));

const mockPrisma = {
    upload: {
        count: vi.fn().mockResolvedValue(0),
        create: vi
            .fn()
            .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
                Promise.resolve({ id: "u-1", ...data, createdAt: new Date() }),
            ),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue({}),
    },
};

vi.mock("@/config/index.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/helpers/file-crypto.js", () => ({
    encryptFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/modules/admin/feature-flags.service.js", () => ({
    resolveUserLimits: vi.fn().mockResolvedValue({ max_uploads: -1 }),
}));

vi.mock("node:fs/promises", () => ({
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:stream/promises", () => ({
    pipeline: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs", () => ({
    createWriteStream: vi.fn().mockReturnValue({}),
}));

const { uploadFile, deleteUpload, getUserUploads } = await import("../uploads.service.js");

const { resolveUserLimits } = await import("@/modules/admin/feature-flags.service.js");
const { encryptFile } = await import("@/helpers/file-crypto.js");
const { unlink } = await import("node:fs/promises");

// ── Helpers ──────────────────────────────────────────────────

function createMockFile(overrides = {}): {
    mimetype: string;
    filename: string;
    file: Readable & { truncated: boolean };
} {
    const stream = new Readable({ read() {} }) as Readable & { truncated: boolean };
    stream.truncated = false;
    return {
        mimetype: "image/png",
        filename: "photo.png",
        file: stream,
        ...overrides,
    };
}

// ── Upload Tests ─────────────────────────────────────────────

describe("uploads.service — uploadFile()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.upload.count.mockResolvedValue(0);
        mockPrisma.upload.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ id: "u-1", ...data, createdAt: new Date() }),
        );
        vi.mocked(resolveUserLimits).mockResolvedValue({ max_uploads: -1 } as ReturnType<
            typeof resolveUserLimits
        > extends Promise<infer T>
            ? T
            : never);
    });

    it("uploads a valid PNG file", async () => {
        const file = createMockFile();
        const result = await uploadFile("user-1", file as never, {});

        expect(result).toBeDefined();
        expect(result.userId).toBe("user-1");
        expect(result.url).toMatch(/^\/uploads\/uploads\//);
    });

    it("accepts JPEG mimetype", async () => {
        const file = createMockFile({ mimetype: "image/jpeg", filename: "photo.jpg" });
        const result = await uploadFile("user-1", file as never, {});
        expect(result).toBeDefined();
    });

    it("accepts WebP mimetype", async () => {
        const file = createMockFile({ mimetype: "image/webp", filename: "image.webp" });
        const result = await uploadFile("user-1", file as never, {});
        expect(result).toBeDefined();
    });

    it("accepts GIF mimetype", async () => {
        const file = createMockFile({ mimetype: "image/gif", filename: "anim.gif" });
        const result = await uploadFile("user-1", file as never, {});
        expect(result).toBeDefined();
    });

    it("accepts AVIF mimetype", async () => {
        const file = createMockFile({ mimetype: "image/avif", filename: "img.avif" });
        const result = await uploadFile("user-1", file as never, {});
        expect(result).toBeDefined();
    });

    it("rejects invalid mime types", async () => {
        const file = createMockFile({ mimetype: "application/pdf", filename: "doc.pdf" });
        await expect(uploadFile("user-1", file as never, {})).rejects.toThrow("Invalid file type");
    });

    it("rejects SVG files", async () => {
        const file = createMockFile({ mimetype: "image/svg+xml", filename: "icon.svg" });
        await expect(uploadFile("user-1", file as never, {})).rejects.toThrow("Invalid file type");
    });

    it("rejects text/html files", async () => {
        const file = createMockFile({ mimetype: "text/html", filename: "page.html" });
        await expect(uploadFile("user-1", file as never, {})).rejects.toThrow("Invalid file type");
    });

    it("enforces upload limit", async () => {
        vi.mocked(resolveUserLimits).mockResolvedValue({ max_uploads: 5 } as ReturnType<
            typeof resolveUserLimits
        > extends Promise<infer T>
            ? T
            : never);
        mockPrisma.upload.count.mockResolvedValue(5);

        const file = createMockFile();
        await expect(uploadFile("user-1", file as never, {})).rejects.toThrow(
            "Upload limit reached",
        );
    });

    it("allows unlimited uploads when max_uploads is -1", async () => {
        vi.mocked(resolveUserLimits).mockResolvedValue({ max_uploads: -1 } as ReturnType<
            typeof resolveUserLimits
        > extends Promise<infer T>
            ? T
            : never);
        mockPrisma.upload.count.mockResolvedValue(1000);

        const file = createMockFile();
        const result = await uploadFile("user-1", file as never, {});
        expect(result).toBeDefined();
    });

    it("stores caption when provided", async () => {
        const file = createMockFile();
        await uploadFile("user-1", file as never, { caption: "Entry setup" });

        expect(mockPrisma.upload.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ caption: "Entry setup" }),
            }),
        );
    });

    it("sets caption to null when not provided", async () => {
        const file = createMockFile();
        await uploadFile("user-1", file as never, {});

        expect(mockPrisma.upload.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ caption: null }),
            }),
        );
    });

    it("calls encryptFile after writing to disk", async () => {
        const file = createMockFile();
        await uploadFile("user-1", file as never, {});
        expect(encryptFile).toHaveBeenCalledOnce();
    });

    it("cleans up file and throws when truncated (too large)", async () => {
        const stream = new Readable({ read() {} }) as Readable & { truncated: boolean };
        stream.truncated = true;
        const file = { mimetype: "image/png", filename: "big.png", file: stream };

        await expect(uploadFile("user-1", file as never, {})).rejects.toThrow("File too large");
        expect(unlink).toHaveBeenCalled();
    });

    it("sets allowedUserIds to contain the uploading user", async () => {
        const file = createMockFile();
        await uploadFile("user-1", file as never, {});

        expect(mockPrisma.upload.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ allowedUserIds: ["user-1"] }),
            }),
        );
    });
});

// ── Delete Tests ─────────────────────────────────────────────

describe("uploads.service — deleteUpload()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deletes an upload owned by the user", async () => {
        mockPrisma.upload.findUnique.mockResolvedValue({
            id: "u-1",
            userId: "user-1",
            url: "/uploads/uploads/test.png",
        });

        await deleteUpload("user-1", "u-1");
        expect(mockPrisma.upload.delete).toHaveBeenCalledWith({ where: { id: "u-1" } });
    });

    it("throws not found for non-existent upload", async () => {
        mockPrisma.upload.findUnique.mockResolvedValue(null);
        await expect(deleteUpload("user-1", "nonexistent")).rejects.toThrow("Upload not found");
    });

    it("throws not found when user does not own the upload", async () => {
        mockPrisma.upload.findUnique.mockResolvedValue({
            id: "u-1",
            userId: "other-user",
            url: "/uploads/uploads/test.png",
        });
        await expect(deleteUpload("user-1", "u-1")).rejects.toThrow("Upload not found");
    });

    it("tries to delete both .enc and plaintext files", async () => {
        mockPrisma.upload.findUnique.mockResolvedValue({
            id: "u-1",
            userId: "user-1",
            url: "/uploads/uploads/abc.png",
        });

        await deleteUpload("user-1", "u-1");
        expect(unlink).toHaveBeenCalledTimes(2);
    });
});

// ── List Uploads Tests ───────────────────────────────────────

describe("uploads.service — getUserUploads()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns uploads for the user", async () => {
        mockPrisma.upload.findMany.mockResolvedValue([
            { id: "u-1", userId: "user-1", url: "/uploads/uploads/test.png" },
        ]);

        const result = await getUserUploads("user-1");
        expect(result).toHaveLength(1);
        expect(mockPrisma.upload.findMany).toHaveBeenCalledWith({
            where: { userId: "user-1" },
            orderBy: { createdAt: "asc" },
        });
    });
});
