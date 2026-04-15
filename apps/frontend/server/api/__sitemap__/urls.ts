import { defineSitemapEventHandler } from "#imports";

export default defineSitemapEventHandler(async () => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBaseURL;

    try {
        const res = await $fetch<{
            success: boolean;
            data: {
                urls: { loc: string; lastmod: string }[];
            };
        }>(`${apiBase}/api/public/sitemap`);

        if (!res.success) return [];

        return res.data.urls.map((u) => ({
            loc: u.loc,
            lastmod: u.lastmod,
            changefreq: "weekly" as const,
            priority: 0.7,
        }));
    } catch {
        return [];
    }
});
