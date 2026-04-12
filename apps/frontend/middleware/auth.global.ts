/**
 * Global auth middleware.
 * Redirects to /login if not authenticated, except for public routes.
 * Redirects unverified users to /verify-email.
 * Redirects non-admins away from /admin routes.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore();
    const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/beta",
        "/unsubscribe",
        "/confirm-delete",
        "/pricing",
    ];

    const publicPrefixes = ["/legal", "/export", "/p/", "/keeper/"];

    // Skip auth check for public routes
    if (publicRoutes.includes(to.path) || publicPrefixes.some((p) => to.path.startsWith(p))) {
        // Try restoring session on auth pages so we can redirect authenticated users
        if (["/login", "/register"].includes(to.path) && !authStore.isAuthenticated) {
            await authStore.init();
        }
        // Redirect authenticated users away from auth pages to dashboard (or redirect target)
        if (authStore.isAuthenticated && ["/login", "/register"].includes(to.path)) {
            const redirect = to.query.redirect as string | undefined;
            const isSafeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//");
            return navigateTo(isSafeRedirect ? redirect : "/dashboard");
        }
        return;
    }

    // Try to restore session if not authenticated
    if (!authStore.isAuthenticated) {
        await authStore.init();
    }

    // Still not authenticated → redirect to login
    if (!authStore.isAuthenticated) {
        return navigateTo({
            path: "/login",
            query: to.fullPath !== "/dashboard" ? { redirect: to.fullPath } : undefined,
        });
    }

    // Email verification gate: unverified users can only access /verify-email
    if (!authStore.emailVerified) {
        if (to.path !== "/verify-email") {
            return navigateTo("/verify-email");
        }
        return;
    }

    // If verified user tries to visit /verify-email, redirect away
    if (to.path === "/verify-email" && authStore.emailVerified) {
        return navigateTo("/dashboard");
    }

    // Admin route protection
    if (to.path.startsWith("/admin") && !authStore.isAdmin) {
        return navigateTo("/dashboard");
    }
});
