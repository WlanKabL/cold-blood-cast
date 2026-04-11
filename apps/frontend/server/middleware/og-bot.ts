const BOT_AGENTS = [
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "discordbot",
    "slackbot",
    "telegrambot",
    "whatsapp",
    "googlebot",
    "bingbot",
    "yandexbot",
    "baiduspider",
    "duckduckbot",
    "pinterest",
    "redditbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "vkshare",
    "skypeuripreview",
];

function isBot(userAgent: string): boolean {
    const ua = userAgent.toLowerCase();
    return BOT_AGENTS.some((bot) => ua.includes(bot));
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname;

    // Only handle /p/:slug paths
    const match = path.match(/^\/p\/([a-z0-9][a-z0-9-]*[a-z0-9])$/);
    if (!match) return;

    const ua = getRequestHeader(event, "user-agent") || "";
    if (!isBot(ua)) return;

    const slug = match[1];
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBaseURL;

    try {
        const res = await $fetch<{ success: boolean; data: {
            name: string;
            bio: string | null;
            species: string | null;
            morph: string | null;
            profilePhotoId: string | null;
            slug: string;
        } }>(`${apiBase}/api/public/pets/${encodeURIComponent(slug)}`);

        if (!res.success) return;

        const pet = res.data;
        const siteUrl = config.public.baseURL || "https://cold-blood-cast.app";
        const title = escapeHtml(`${pet.name} — KeeperLog`);
        const description = escapeHtml(
            pet.bio ??
            (pet.species
                ? `${pet.name} — ${pet.species}${pet.morph ? ` (${pet.morph})` : ""}`
                : pet.name),
        );
        const url = `${siteUrl}/p/${pet.slug}`;
        const image = pet.profilePhotoId
            ? `${apiBase}/api/public/pets/${pet.slug}/photos/${pet.profilePhotoId}`
            : `${siteUrl}/cbc.png`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:site_name" content="KeeperLog" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
</body>
</html>`;

        setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
        return html;
    } catch {
        // API error — let the SPA handle it
        return;
    }
});
