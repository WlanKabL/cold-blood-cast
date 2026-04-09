/**
 * Named route middleware: feature-gate
 *
 * Blocks navigation to pages that require a feature the user doesn't have.
 *
 * Usage in any page:
 *   definePageMeta({ middleware: ["feature-gate"], requiredFeature: "sensors" })
 */
export default defineNuxtRouteMiddleware((to) => {
    const requiredFeature = to.meta.requiredFeature as string | undefined;
    if (!requiredFeature) return;

    const authStore = useAuthStore();
    if (!authStore.hasFeature(requiredFeature)) {
        return navigateTo("/dashboard", { replace: true });
    }
});
