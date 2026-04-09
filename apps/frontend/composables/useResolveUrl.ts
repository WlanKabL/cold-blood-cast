/**
 * Returns a function that resolves relative upload URLs to absolute
 * authenticated URLs by appending the current access token as a query param.
 *
 * Usage:
 *   const resolveUrl = useResolveUrl();
 *   // in template: :src="resolveUrl(screenshot.url)"
 */
export function useResolveUrl() {
    const baseURL = useRuntimeConfig().public.apiBaseURL;
    const authStore = useAuthStore();

    return (url: string): string => {
        if (!url) return "";
        if (url.startsWith("http")) return url;

        const base = `${baseURL}${url}`;

        // Append auth token for protected /uploads/ paths
        if (url.startsWith("/uploads/") && authStore.accessToken) {
            const sep = base.includes("?") ? "&" : "?";
            return `${base}${sep}t=${authStore.accessToken}`;
        }

        return base;
    };
}
