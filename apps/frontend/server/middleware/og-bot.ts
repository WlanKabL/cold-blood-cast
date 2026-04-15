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
    const ua = getRequestHeader(event, "user-agent") || "";
    if (!isBot(ua)) return;

    const config = useRuntimeConfig();
    const apiBase = config.public.apiBaseURL;
    const siteUrl = config.public.baseURL || "https://cold-blood-cast.app";

    // ── Handle /keeper/:slug ──
    const keeperMatch = path.match(/^\/keeper\/([a-z0-9][a-z0-9-]*[a-z0-9])$/);
    if (keeperMatch) {
        const slug = keeperMatch[1];
        try {
            const res = await $fetch<{
                success: boolean;
                data: {
                    username: string;
                    displayName: string | null;
                    tagline: string | null;
                    bio: string | null;
                    hasAvatar: boolean;
                    slug: string;
                    location: string | null;
                };
            }>(`${apiBase}/api/public/users/${encodeURIComponent(slug)}`);

            if (!res.success) return;

            const user = res.data;
            const name = user.displayName || user.username;
            const title = escapeHtml(`${name} — KeeperLog`);
            const description = escapeHtml(user.tagline || user.bio || name);
            const url = `${siteUrl}/keeper/${user.slug}`;
            const image = user.hasAvatar
                ? `${apiBase}/api/public/users/${user.slug}/avatar`
                : `${siteUrl}/cbc.png`;

            const jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ProfilePage",
                mainEntity: {
                    "@type": "Person",
                    name,
                    url,
                    image,
                    ...(user.tagline || user.bio
                        ? { description: user.tagline || user.bio }
                        : {}),
                    ...(user.location
                        ? { address: { "@type": "PostalAddress", addressLocality: user.location } }
                        : {}),
                },
            });

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
    <script type="application/ld+json">${escapeHtml(jsonLd)}</script>
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
</body>
</html>`;

            setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
            return html;
        } catch {
            return;
        }
    }

    // ── Handle /p/:slug paths ──
    const petMatch = path.match(/^\/p\/([a-z0-9][a-z0-9-]*[a-z0-9])$/);
    if (!petMatch) return;

    const slug = petMatch[1];

    try {
        const res = await $fetch<{
            success: boolean;
            data: {
                name: string;
                bio: string | null;
                species: string | null;
                morph: string | null;
                profilePhotoId: string | null;
                slug: string;
            };
        }>(`${apiBase}/api/public/pets/${encodeURIComponent(slug)}`);

        if (!res.success) return;

        const pet = res.data;
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

        const petJsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
                "@type": "Thing",
                name: pet.name,
                url,
                image,
                ...(pet.bio ? { description: pet.bio } : {}),
                ...(pet.species ? { additionalType: pet.species } : {}),
            },
        });

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
    <script type="application/ld+json">${escapeHtml(petJsonLd)}</script>
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
