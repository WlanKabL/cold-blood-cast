/**
 * Reactive feature-access check for use in templates / conditional UI.
 *
 * **Page-level routing guards** should use the `feature-gate` middleware instead:
 *   definePageMeta({ middleware: ["feature-gate"], requiredFeature: "trades" })
 */
export function useFeatureAccess(featureKey: string) {
    const authStore = useAuthStore();
    return computed(() => authStore.hasFeature(featureKey));
}
