export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore();

    // Wait for auth to initialize (token refresh) before checking state
    await authStore.init();

    const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/about",
        "/contact",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/confirm-delete",
        "/unsubscribe",
    ];
    const isPublic =
        publicRoutes.includes(to.path) ||
        to.path.startsWith("/__") ||
        to.path.startsWith("/legal") ||
        to.path.startsWith("/export/");

    // 404 catch-all is always accessible
    if (to.name === "notFound" || to.matched.length === 0) return;

    // Redirect authenticated users away from login/register to dashboard
    if ((to.path === "/login" || to.path === "/register") && authStore.isLoggedIn) {
        return navigateTo("/dashboard");
    }

    // Public routes are always accessible
    if (isPublic) return;

    // Protected routes require authentication
    if (!authStore.isLoggedIn) {
        return navigateTo({
            path: "/login",
            query: to.fullPath !== "/dashboard" ? { redirect: to.fullPath } : undefined,
        });
    }

    // Admin route protection
    if (to.path.startsWith("/admin") && !authStore.isAdmin) {
        return navigateTo("/dashboard");
    }
});
