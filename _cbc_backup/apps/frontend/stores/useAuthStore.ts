import { defineStore } from "pinia";
import type { UserProfile } from "@cold-blood-cast/shared";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<UserProfile | null>(null);
    const accessToken = ref<string | null>(null);
    const loading = ref(false);
    const initialized = ref(false);
    let initPromise: Promise<void> | null = null;

    const apiBaseURL = useRuntimeConfig().public.apiBaseUrl;

    /**
     * Lightweight fetch helper for auth endpoints.
     * Uses native fetch() with credentials: "include" — independent of the
     * http.client.ts plugin so it works in any context (middleware, SSR, etc.).
     */
    async function authFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            ...(opts.body ? { "Content-Type": "application/json" } : {}),
            ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
        };

        const res = await fetch(`${apiBaseURL}${path}`, {
            ...opts,
            headers,
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(`Auth request failed: ${res.status}`);
        }

        return (await res.json()) as T;
    }

    const isLoggedIn = computed(() => user.value !== null);
    const isAdmin = computed(() => user.value?.isAdmin === true);

    const userRoles = computed(() => user.value?.roles ?? []);
    const enabledFlags = computed(() => user.value?.enabledFlags ?? []);
    const userLimits = computed(() => user.value?.limits ?? {});

    function hasFeature(key: string): boolean {
        return enabledFlags.value.includes(key);
    }

    function hasRole(name: string): boolean {
        return userRoles.value.some((r) => r.name === name);
    }

    function getLimit(key: string): number | undefined {
        return userLimits.value[key];
    }

    const userInitial = computed(() => {
        const name = user.value?.displayName || user.value?.username || "?";
        return name.charAt(0).toUpperCase();
    });

    async function fetchUser() {
        if (!accessToken.value) return;
        try {
            loading.value = true;
            const data = await authFetch<UserProfile>("/api/auth/me");
            user.value = data;
        } catch {
            user.value = null;
            accessToken.value = null;
        } finally {
            loading.value = false;
        }
    }

    async function refresh(): Promise<boolean> {
        try {
            const data = await authFetch<{ accessToken: string }>("/api/auth/refresh", {
                method: "POST",
            });
            accessToken.value = data.accessToken;
            return true;
        } catch {
            accessToken.value = null;
            user.value = null;
            return false;
        }
    }

    async function init() {
        if (initialized.value) return;
        if (initPromise) return initPromise;
        initPromise = (async () => {
            try {
                const ok = await refresh();
                if (ok) {
                    await fetchUser();
                }
            } finally {
                initialized.value = true;
                initPromise = null;
            }
        })();
        return initPromise;
    }

    async function login(username: string, password: string) {
        const data = await authFetch<{ accessToken: string }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        accessToken.value = data.accessToken;
        await fetchUser();
    }

    async function register(payload: {
        email: string;
        username: string;
        password: string;
        displayName?: string;
        inviteCode?: string;
    }): Promise<{ pendingApproval: boolean }> {
        const data = await authFetch<{ accessToken?: string; pendingApproval?: boolean }>(
            "/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
        if (data.pendingApproval) {
            return { pendingApproval: true };
        }
        accessToken.value = data.accessToken ?? null;
        await fetchUser();
        return { pendingApproval: false };
    }

    async function logout() {
        try {
            await authFetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Best-effort logout
        } finally {
            user.value = null;
            accessToken.value = null;
        }
    }

    return {
        user,
        accessToken,
        loading,
        initialized,
        isLoggedIn,
        isAdmin,
        userRoles,
        enabledFlags,
        userLimits,
        hasFeature,
        hasRole,
        getLimit,
        userInitial,
        init,
        fetchUser,
        refresh,
        login,
        register,
        logout,
    };
});
