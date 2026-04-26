import { defineStore } from "pinia";
import type { AuthUser, LoginPayload, RegisterPayload, FeatureTierInfo } from "~/types/api";

export type { FeatureTierInfo };

/** Error subclass that preserves the backend error code (e.g. E_MAINTENANCE_MODE). */
class AuthApiError extends Error {
    readonly code: string | undefined;
    constructor(message: string, code?: string) {
        super(message);
        this.name = "AuthApiError";
        this.code = code;
    }
}

export const useAuthStore = defineStore("auth", () => {
    const accessToken = ref<string | null>(null);
    const user = ref<AuthUser | null>(null);
    const roles = ref<string[]>([]);
    const features = ref<Record<string, boolean>>({});
    const limits = ref<Record<string, number>>({});
    const enabledFlags = ref<string[]>([]);
    const featureTiers = ref<Record<string, FeatureTierInfo[]>>({});
    const impersonatedBy = ref<string | null>(null);
    const loading = ref(false);
    const emailVerified = ref(true); // Default true to prevent flash on init

    const apiBaseURL = useRuntimeConfig().public.apiBaseURL;

    /**
     * Lightweight fetch helper for auth endpoints.
     * Handles JSON parsing, success check, and error extraction.
     * Does NOT use `useApi` (which itself depends on this store for the token).
     */
    async function authFetch<T = Record<string, unknown>>(
        path: string,
        opts: RequestInit = {},
    ): Promise<T> {
        const headers: Record<string, string> = {
            ...(opts.body ? { "Content-Type": "application/json" } : {}),
            ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
            ...(opts.headers as Record<string, string> | undefined),
        };

        const res = await fetch(`${apiBaseURL}${path}`, {
            ...opts,
            headers,
            credentials: "include",
        });

        const json = await res.json();
        if (!json.success) {
            throw new AuthApiError(json.error?.message || "Request failed", json.error?.code);
        }
        return json.data as T;
    }

    const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
    const isAdmin = computed(() => roles.value.includes("ADMIN"));
    const isModerator = computed(() => roles.value.includes("MODERATOR") || isAdmin.value);
    const isPremium = computed(() => roles.value.includes("PREMIUM") || isAdmin.value);
    const isImpersonating = computed(() => !!impersonatedBy.value);

    function hasRole(role: string): boolean {
        return roles.value.includes(role);
    }

    function hasFeature(key: string): boolean {
        return features.value[key] === true;
    }

    /** Feature is globally enabled (admin toggle on) — regardless of user role */
    function isFeatureEnabled(key: string): boolean {
        return enabledFlags.value.includes(key);
    }

    /** Get tier info for a locked feature (all roles that would unlock it) */
    function getFeatureTier(key: string): FeatureTierInfo[] {
        return featureTiers.value[key] ?? [];
    }

    function getLimit(key: string, fallback = 0): number {
        return limits.value[key] ?? fallback;
    }

    // ── Login ────────────────────────────────────
    async function login(payload: LoginPayload) {
        loading.value = true;
        try {
            const data = await authFetch<{
                tokens: { accessToken: string };
                user: AuthUser;
            }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            accessToken.value = data.tokens.accessToken;
            user.value = data.user;
            await fetchMe();
            return data.user;
        } finally {
            loading.value = false;
        }
    }

    // ── Register ─────────────────────────────────
    async function register(payload: RegisterPayload) {
        loading.value = true;
        try {
            const data = await authFetch<{
                pendingApproval?: boolean;
                tokens?: { accessToken: string };
                user?: AuthUser;
                marketingDispatch?:
                    | import("@cold-blood-cast/shared").MarketingRegistrationDispatchInfo
                    | null;
            }>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (data.pendingApproval) {
                return { pendingApproval: true as const };
            }

            accessToken.value = data.tokens!.accessToken;
            user.value = data.user!;
            await fetchMe();
            return { user: data.user!, marketingDispatch: data.marketingDispatch ?? null };
        } finally {
            loading.value = false;
        }
    }

    // ── Refresh ──────────────────────────────────
    async function tryRefresh(): Promise<boolean> {
        try {
            const data = await authFetch<{ tokens: { accessToken: string } }>("/api/auth/refresh", {
                method: "POST",
            });
            accessToken.value = data.tokens.accessToken;
            return true;
        } catch {
            return false;
        }
    }

    // ── Fetch Me ─────────────────────────────────
    async function fetchMe(): Promise<boolean> {
        if (!accessToken.value) return false;

        try {
            const data = await authFetch<{
                user: AuthUser;
                roles?: string[];
                features?: Record<string, boolean>;
                limits?: Record<string, number>;
                enabledFlags?: string[];
                featureTiers?: Record<string, FeatureTierInfo[]>;
                impersonatedBy?: string | null;
            }>("/api/auth/me");

            user.value = data.user;
            roles.value = data.roles ?? [];
            features.value = data.features ?? {};
            limits.value = data.limits ?? {};
            enabledFlags.value = data.enabledFlags ?? [];
            featureTiers.value = data.featureTiers ?? {};
            impersonatedBy.value = data.impersonatedBy ?? null;
            emailVerified.value = data.user?.emailVerified ?? true;

            // Sync locale from backend to local settings
            if (data.user?.locale) {
                const settings = useSettingsStore();
                if (settings.currentLocale !== data.user.locale) {
                    settings.setLocale(data.user.locale);
                }
            }

            return true;
        } catch (err) {
            clear();
            // Re-throw maintenance errors so callers (e.g. login page) can display them
            if (err instanceof AuthApiError && err.code === "E_MAINTENANCE_MODE") throw err;
            return false;
        }
    }

    // ── Logout ───────────────────────────────────
    async function logout() {
        try {
            await authFetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Best-effort logout
        }
        clear();
    }

    // ── Init (try to restore session) ────────────
    async function init() {
        const refreshed = await tryRefresh();
        if (refreshed) {
            await fetchMe();
        }
    }

    function clear() {
        accessToken.value = null;
        user.value = null;
        roles.value = [];
        features.value = {};
        limits.value = {};
        enabledFlags.value = [];
        featureTiers.value = {};
        impersonatedBy.value = null;
        emailVerified.value = true;
    }

    // ── Verify Email ─────────────────────────────
    async function verifyEmailCode(code: string): Promise<void> {
        await authFetch("/api/auth/verify-email", {
            method: "POST",
            body: JSON.stringify({ code }),
        });

        emailVerified.value = true;
        if (user.value) {
            user.value = { ...user.value, emailVerified: true };
        }
    }

    async function resendVerification(): Promise<void> {
        await authFetch("/api/auth/resend-verification", { method: "POST" });
    }

    // ── Password Reset ───────────────────────────
    async function forgotPassword(email: string): Promise<void> {
        await authFetch("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    }

    async function resetUserPassword(token: string, newPassword: string): Promise<void> {
        await authFetch("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, newPassword }),
        });
    }

    return {
        accessToken,
        user,
        roles,
        features,
        limits,
        enabledFlags,
        featureTiers,
        impersonatedBy,
        loading,
        emailVerified,
        isAuthenticated,
        isAdmin,
        isModerator,
        isPremium,
        isImpersonating,
        hasRole,
        hasFeature,
        isFeatureEnabled,
        getFeatureTier,
        getLimit,
        login,
        register,
        tryRefresh,
        fetchMe,
        logout,
        init,
        clear,
        verifyEmailCode,
        resendVerification,
        forgotPassword,
        resetUserPassword,
    };
});
