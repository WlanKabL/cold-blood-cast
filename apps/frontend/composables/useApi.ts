import type { ApiResponse, ApiErrorResponse } from "~/types/api";

export class ApiError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(response: ApiErrorResponse, statusCode: number) {
        super(response.error.message);
        this.name = "ApiError";
        this.code = response.error.code;
        this.statusCode = statusCode;
        this.details = response.error.details;
    }
}

export function useApi() {
    const baseURL = useRuntimeConfig().public.apiBaseURL;

    async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const authStore = useAuthStore();
        const headers = new Headers(options.headers);

        // Auto-attach access token
        if (authStore.accessToken) {
            headers.set("Authorization", `Bearer ${authStore.accessToken}`);
        }

        if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
            headers.set("Content-Type", "application/json");
        }

        const url = path.startsWith("http") ? path : `${baseURL}${path}`;

        let res = await fetch(url, {
            ...options,
            headers,
            credentials: "include", // Send cookies (refresh token)
        });

        // Try refresh on 401
        if (res.status === 401 && authStore.accessToken) {
            const refreshed = await authStore.tryRefresh();
            if (refreshed) {
                headers.set("Authorization", `Bearer ${authStore.accessToken}`);
                res = await fetch(url, {
                    ...options,
                    headers,
                    credentials: "include",
                });
            }
        }

        const json = (await res.json()) as ApiResponse<T>;

        if (!json.success) {
            const apiError = new ApiError(json as ApiErrorResponse, res.status);

            // Global ban/suspension handling — verify session and force logout
            if (res.status === 403 && apiError.code === "E_USER_BANNED") {
                const toast = useToast();
                const { $i18n } = useNuxtApp();
                toast.add({
                    title: apiError.message || $i18n.t("errors.accountSuspended"),
                    color: "red",
                    timeout: 10000,
                });
                await authStore.logout();
                await navigateTo("/login");
                throw apiError;
            }

            // Global maintenance mode handling — show toast to inform user
            if (res.status === 503 && apiError.code === "E_MAINTENANCE_MODE") {
                const toast = useToast();
                const { $i18n } = useNuxtApp();
                toast.add({
                    title: apiError.message || $i18n.t("errors.maintenanceMode"),
                    color: "amber",
                    timeout: 10000,
                });
            }

            throw apiError;
        }

        return json.data;
    }

    function get<T>(path: string) {
        return request<T>(path);
    }

    function post<T>(path: string, body?: unknown) {
        return request<T>(path, {
            method: "POST",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }

    function put<T>(path: string, body?: unknown) {
        return request<T>(path, {
            method: "PUT",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }

    function patch<T>(path: string, body?: unknown) {
        return request<T>(path, {
            method: "PATCH",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }

    function del<T = void>(path: string) {
        return request<T>(path, { method: "DELETE" });
    }

    return { request, get, post, put, patch, del };
}
