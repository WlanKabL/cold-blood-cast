import { type FastifyInstance } from "fastify";
import { prisma } from "@/config/database.js";

export async function sitemapRoutes(app: FastifyInstance) {
    // GET /api/public/sitemap — returns all active public profile URLs for sitemap generation
    app.get("/", async () => {
        const [users, pets] = await Promise.all([
            prisma.userPublicProfile.findMany({
                where: { active: true },
                select: { slug: true, updatedAt: true },
            }),
            prisma.publicProfile.findMany({
                where: { active: true },
                include: {
                    user: {
                        select: {
                            userPublicProfile: { select: { slug: true, active: true } },
                        },
                    },
                },
            }),
        ]);

        const keeperUrls = users.map((u) => ({
            loc: `/keeper/${u.slug}`,
            lastmod: u.updatedAt.toISOString(),
        }));

        const petUrls = pets
            .filter((p) => p.user?.userPublicProfile?.active && p.user.userPublicProfile.slug)
            .map((p) => ({
                loc: `/keeper/${p.user!.userPublicProfile!.slug}/p/${p.slug}`,
                lastmod: p.updatedAt.toISOString(),
            }));

        return { success: true, data: { urls: [...keeperUrls, ...petUrls] } };
    });
}
