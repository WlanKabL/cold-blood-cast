/**
 * Detect the user's preferred locale from the browser, falling back to a default.
 *
 * Used on first visit (when no locale is stored in localStorage) so that German
 * visitors land on the German UI immediately — better engagement for paid traffic.
 *
 * Strategy:
 * 1. Walk navigator.languages (ordered by user preference) and return the first
 *    entry whose primary subtag matches a supported locale.
 * 2. Fall back to navigator.language.
 * 3. Fall back to the provided default.
 */
export function detectBrowserLocale(supported: readonly string[], fallback: string): string {
    if (typeof navigator === "undefined") return fallback;

    const candidates: string[] = [];
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        candidates.push(...navigator.languages);
    }
    if (typeof navigator.language === "string" && navigator.language.length > 0) {
        candidates.push(navigator.language);
    }

    for (const candidate of candidates) {
        const primary = candidate.toLowerCase().split("-")[0];
        if (supported.includes(primary)) return primary;
    }

    return fallback;
}
