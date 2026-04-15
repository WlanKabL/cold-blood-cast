import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    userPublicProfile: {
        findMany: vi.fn(),
    },
    publicProfile: {
        findMany: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));

// We test the route handler logic by importing the module and calling the handler.
// Since it's a Fastify plugin, we simulate the registration.
const { sitemapRoutes } = await import("../sitemap.routes.js");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("sitemapRoutes", () => {
    it("registers a GET / handler", async () => {
        const handlers: Record<string, unknown> = {};
        const mockApp = {
            get: vi.fn((path: string, handler: unknown) => {
                handlers[path] = handler;
            }),
        };

        await sitemapRoutes(mockApp as never);
        expect(mockApp.get).toHaveBeenCalledWith("/", expect.any(Function));
    });

    it("returns keeper and pet URLs for active profiles", async () => {
        mockPrisma.userPublicProfile.findMany.mockResolvedValue([
            { slug: "john-doe", updatedAt: new Date("2026-04-01T00:00:00Z") },
            { slug: "jane-doe", updatedAt: new Date("2026-04-10T00:00:00Z") },
        ]);

        mockPrisma.publicProfile.findMany.mockResolvedValue([
            {
                slug: "monty",
                updatedAt: new Date("2026-04-05T00:00:00Z"),
                user: {
                    userPublicProfile: { slug: "john-doe", active: true },
                },
            },
            {
                slug: "slinky",
                updatedAt: new Date("2026-04-08T00:00:00Z"),
                user: {
                    userPublicProfile: null,
                },
            },
        ]);

        let handler: () => Promise<unknown> = async () => ({});
        const mockApp = {
            get: vi.fn((_path: string, h: () => Promise<unknown>) => {
                handler = h;
            }),
        };

        await sitemapRoutes(mockApp as never);
        const result = await handler();

        expect(result).toEqual({
            success: true,
            data: {
                urls: [
                    { loc: "/keeper/john-doe", lastmod: "2026-04-01T00:00:00.000Z" },
                    { loc: "/keeper/jane-doe", lastmod: "2026-04-10T00:00:00.000Z" },
                    { loc: "/keeper/john-doe/p/monty", lastmod: "2026-04-05T00:00:00.000Z" },
                ],
            },
        });
    });

    it("filters out pet profiles without active user profile", async () => {
        mockPrisma.userPublicProfile.findMany.mockResolvedValue([]);
        mockPrisma.publicProfile.findMany.mockResolvedValue([
            {
                slug: "lonely-pet",
                updatedAt: new Date("2026-04-01"),
                user: { userPublicProfile: { slug: "inactive-user", active: false } },
            },
        ]);

        let handler: () => Promise<unknown> = async () => ({});
        const mockApp = {
            get: vi.fn((_path: string, h: () => Promise<unknown>) => {
                handler = h;
            }),
        };

        await sitemapRoutes(mockApp as never);
        const result = (await handler()) as { data: { urls: unknown[] } };

        expect(result.data.urls).toEqual([]);
    });

    it("returns empty arrays when no profiles exist", async () => {
        mockPrisma.userPublicProfile.findMany.mockResolvedValue([]);
        mockPrisma.publicProfile.findMany.mockResolvedValue([]);

        let handler: () => Promise<unknown> = async () => ({});
        const mockApp = {
            get: vi.fn((_path: string, h: () => Promise<unknown>) => {
                handler = h;
            }),
        };

        await sitemapRoutes(mockApp as never);
        const result = (await handler()) as { data: { urls: unknown[] } };

        expect(result.data.urls).toEqual([]);
    });
});
