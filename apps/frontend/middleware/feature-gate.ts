/**
 * Named route middleware: feature-gate
 *
 * Blocks navigation to pages that require a feature the user doesn't have.
 * Runs BEFORE <script setup>, so component hooks and API calls never fire.
 *
 * Usage in any page:
 *   definePageMeta({ middleware: ["feature-gate"], requiredFeature: "trades" })
 */
export default defineNuxtRouteMiddleware((to) => {
    const requiredFeature = to.meta.requiredFeature as string | undefined;
    if (!requiredFeature) return;

    const authStore = useAuthStore();
    if (!authStore.hasFeature(requiredFeature)) {
        return navigateTo("/upgrade", { replace: true });
    }
});
